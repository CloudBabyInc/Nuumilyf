import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ChevronLeft, Plus, Calendar, Clock, Filter, Search, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealCard from '@/components/meals/MealCard';
import MealPlanCalendar from '@/components/meals/MealPlanCalendar';
import AIMealPlanner from '@/components/meals/AIMealPlanner';
import SavedMealPlanSelector from '@/components/meals/SavedMealPlanSelector';
import { useTheme } from '@/components/theme/ThemeProvider';

// Types
interface Meal {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  emoji?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  user_id: string;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_id: string;
  user_id: string;
  meal?: Meal;
}

const MealPlanning = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  // Check for state passed from AIMealPlanner
  useEffect(() => {
    if (location.state) {
      const { refreshCalendar, selectedDate: newDate, activeTab: newTab } = location.state as any;

      if (refreshCalendar) {
        console.log('Refreshing calendar with state:', location.state);

        // Clear the state to prevent it from being used again on refresh
        window.history.replaceState({}, document.title);

        // Set the active tab
        if (newTab) {
          setActiveTab(newTab);
        }

        // Set the selected date if provided
        if (newDate) {
          setSelectedDate(new Date(newDate));
        }

        // Force refresh meal plans
        if (currentUser) {
          fetchMealPlans(currentUser.id);
        }
      }
    }
  }, [location.state, currentUser]);

  // Function to fetch meal plans (extracted for reuse)
  const fetchMealPlans = async (userId: string) => {
    try {
      console.log(`Fetching meal plans for user: ${userId}`);

      // First check if the user exists
      if (!userId) {
        console.error('Cannot fetch meal plans: No user ID provided');
        return;
      }

      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*, meal:meal_id(*)')
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase error fetching meal plans:', error);
        throw error;
      }

      if (data) {
        console.log(`Successfully fetched ${data.length} meal plans:`, data);

        // Check if meal data is properly loaded
        const missingMeals = data.filter(plan => !plan.meal);
        if (missingMeals.length > 0) {
          console.warn(`${missingMeals.length} meal plans have missing meal data:`, missingMeals);
        }

        setMealPlans(data as MealPlan[]);
      } else {
        console.log('No meal plans found for user');
        setMealPlans([]);
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      toast.error('Failed to load meal plans. Please try again.');
    }
  };

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        setCurrentUser({
          id: session.user.id,
          ...userData
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch meals
  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true);
      try {
        // Fetch sample meals for now
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setMeals(data as Meal[]);
          setFilteredMeals(data as Meal[]);
        }
      } catch (error) {
        toast.error('Failed to load meals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, []);

  // Fetch meal plans
  useEffect(() => {
    if (currentUser) {
      fetchMealPlans(currentUser.id);
    }
  }, [currentUser]);

  // Filter meals based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMeals(meals);
    } else {
      const filtered = meals.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredMeals(filtered);
    }
  }, [searchQuery, meals]);

  const handleAddMealPlan = async (meal: Meal, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!currentUser) {
      toast.error('Please sign in to add a meal plan');
      return;
    }

    try {
      const dateString = selectedDate.toISOString().split('T')[0];

      // Check if meal plan already exists for this date and meal type
      const { data: existingPlan, error: checkError } = await supabase
        .from('calendar_entries')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('date', dateString)
        .eq('meal_type', mealType)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPlan) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from('calendar_entries')
          .update({ meal_id: meal.id })
          .eq('id', existingPlan.id);

        if (updateError) throw updateError;

        toast.success(`Updated ${mealType} for ${dateString}`);
      } else {
        // Create new plan
        const { error: insertError } = await supabase
          .from('calendar_entries')
          .insert({
            user_id: currentUser.id,
            meal_id: meal.id,
            date: dateString,
            meal_type: mealType
          });

        if (insertError) throw insertError;

        toast.success(`Added ${meal.name} to ${mealType} for ${dateString}`);
      }

      // Refresh meal plans
      await fetchMealPlans(currentUser.id);
    } catch (error) {
      console.error('Error adding meal to plan:', error);
      toast.error('Failed to add meal to plan');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
      </div>
    );
  }

  // Handle adding a meal from AI meal plans
  const handleAddMealFromAI = async (meal: any, mealType: string) => {
    if (!currentUser) {
      toast.error('Please sign in to add a meal plan');
      return false;
    }

    try {
      console.log('Adding AI meal to calendar:', meal);
      console.log('Meal type:', mealType);
      console.log('Selected date:', selectedDate);

      // Validate meal type
      if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType.toLowerCase())) {
        console.error(`Invalid meal type: ${mealType}`);
        toast.error(`Invalid meal type: ${mealType}. Please select a valid meal type.`);
        return false;
      }

      // Normalize meal type
      const normalizedMealType = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack';

      // Create a new meal entry from the AI meal with detailed error handling
      let mealInsertResult;
      try {
        mealInsertResult = await supabase
          .from('meals')
          .insert({
            name: meal.name || 'Unnamed Meal',
            description: meal.benefits || 'AI-generated meal',
            emoji: meal.imageEmoji || '🍽️',
            calories: Math.round(Number(meal.nutrients?.calories) || 0),
            protein: Math.round(Number(meal.nutrients?.protein) || 0),
            carbs: Math.round(Number(meal.nutrients?.carbs) || 0),
            fat: Math.round(Number(meal.nutrients?.fat) || 0),
            prep_time: 30, // Default prep time
            tags: ['ai-generated'],
            ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
            instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
            user_id: currentUser.id
          })
          .select()
          .single();
      } catch (insertError) {
        console.error('Error creating meal (caught exception):', insertError);
        toast.error('Failed to create meal record. Please try again.');
        return false;
      }

      if (mealInsertResult.error) {
        console.error('Error creating meal:', mealInsertResult.error);
        toast.error(`Failed to create meal: ${mealInsertResult.error.message}`);
        return false;
      }

      const mealData = mealInsertResult.data;
      console.log(`Successfully created meal with ID: ${mealData.id}`);

      // Add the meal to the calendar
      const dateString = selectedDate.toISOString().split('T')[0];

      // Check if meal plan already exists for this date and meal type
      let checkResult;
      try {
        checkResult = await supabase
          .from('calendar_entries')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('date', dateString)
          .eq('meal_type', normalizedMealType)
          .maybeSingle();
      } catch (checkError) {
        console.error('Error checking existing plan (caught exception):', checkError);
        toast.error('Failed to check existing meal plans. Please try again.');
        return false;
      }

      if (checkResult.error) {
        console.error('Error checking existing plan:', checkResult.error);
        toast.error(`Failed to check existing meal plans: ${checkResult.error.message}`);
        return false;
      }

      const existingPlan = checkResult.data;

      // Either update existing plan or create a new one
      let updateResult;
      if (existingPlan) {
        console.log(`Updating existing meal plan (ID: ${existingPlan.id}) for ${normalizedMealType} on ${dateString}`);
        try {
          updateResult = await supabase
            .from('calendar_entries')
            .update({ meal_id: mealData.id })
            .eq('id', existingPlan.id);
        } catch (updateError) {
          console.error('Error updating meal plan (caught exception):', updateError);
          toast.error('Failed to update existing meal plan. Please try again.');
          return false;
        }

        if (updateResult.error) {
          console.error('Error updating meal plan:', updateResult.error);
          toast.error(`Failed to update meal plan: ${updateResult.error.message}`);
          return false;
        }
      } else {
        console.log(`Creating new meal plan for ${normalizedMealType} on ${dateString}`);
        try {
          updateResult = await supabase
            .from('calendar_entries')
            .insert({
              user_id: currentUser.id,
              meal_id: mealData.id,
              date: dateString,
              meal_type: normalizedMealType
            });
        } catch (insertError) {
          console.error('Error inserting meal plan (caught exception):', insertError);
          toast.error('Failed to create new meal plan. Please try again.');
          return false;
        }

        if (updateResult.error) {
          console.error('Error inserting meal plan:', updateResult.error);
          toast.error(`Failed to create meal plan: ${updateResult.error.message}`);
          return false;
        }
      }

      console.log('Successfully added meal to calendar');

      // Refresh meal plans
      await fetchMealPlans(currentUser.id);

      return true;
    } catch (error) {
      console.error('Unexpected error adding AI meal to plan:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title="Baby & Mother Meal Planning"
        showBackButton={true}
        onBackClick={() => navigate(-1)}
      />

      {/* Saved Meal Plan Selector Dialog */}
      <SavedMealPlanSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelectMeal={handleAddMealFromAI}
        mealType={selectedMealType}
      />

      <div className="max-w-md mx-auto px-4">
        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="myplan">My Plan</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-1" />
              AI Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meals..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTab('ai')}
                className="text-nuumi-pink"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredMeals.length > 0 ? (
                filteredMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onAddToMealPlan={handleAddMealPlan}
                    selectedDate={selectedDate}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No meals found</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      variant="default"
                      className="bg-nuumi-pink hover:bg-nuumi-pink/90"
                      onClick={() => navigate('/create-meal')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Meal
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('ai')}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Use AI Meal Planner
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="myplan">
            <MealPlanCalendar
              mealPlans={mealPlans}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onAddMeal={(mealType) => {
                // Open the saved meal plan selector with the selected meal type
                setSelectedMealType(mealType);
                setSelectorOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="ai">
            <AIMealPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MealPlanning;
