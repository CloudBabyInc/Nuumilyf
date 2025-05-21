import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getUserMealPlans } from '@/services/mealPlanning/aiMealService';

interface SavedMealPlanSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal: (meal: any, mealType: string) => Promise<void>;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

const SavedMealPlanSelector: React.FC<SavedMealPlanSelectorProps> = ({
  isOpen,
  onClose,
  onSelectMeal,
  mealType
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch saved meal plans
  useEffect(() => {
    const fetchMealPlans = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const plans = await getUserMealPlans(currentUser.id);
        console.log(`Fetched ${plans.length} saved meal plans`);
        setMealPlans(plans);
        setFilteredPlans(plans);
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        toast.error('Failed to load saved meal plans');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && isOpen) {
      fetchMealPlans();
    }
  }, [currentUser, isOpen]);

  // Filter meal plans based on search query
  useEffect(() => {
    if (!mealPlans.length) return;

    if (searchQuery.trim() === '') {
      setFilteredPlans(mealPlans);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = mealPlans.filter(plan => {
        // Search in plan introduction
        if (plan.plan_data?.introduction?.toLowerCase().includes(query)) {
          return true;
        }

        // Search in meal names
        if (plan.plan_data?.meals?.some((meal: any) =>
          meal.name?.toLowerCase().includes(query)
        )) {
          return true;
        }

        return false;
      });

      setFilteredPlans(filtered);
    }
  }, [searchQuery, mealPlans]);

  const handleSelectMeal = async (plan: any, mealIndex: number = 0) => {
    try {
      if (!plan.plan_data || !plan.plan_data.meals || !plan.plan_data.meals.length) {
        toast.error('Invalid meal plan data');
        return;
      }

      console.log('Selected plan:', plan);
      console.log('Selected meal index:', mealIndex);

      // Get the specified meal from the plan
      const meal = plan.plan_data.meals[mealIndex] || plan.plan_data.meals[0];

      // Prepare the meal data to match what the calendar expects
      const processedMeal = {
        name: meal.name,
        benefits: meal.benefits || 'AI-generated meal',
        imageEmoji: meal.imageEmoji || '🍽️',
        nutrients: {
          calories: Math.round(Number(meal.nutrients?.calories) || 0),
          protein: Math.round(Number(meal.nutrients?.protein) || 0),
          carbs: Math.round(Number(meal.nutrients?.carbs) || 0),
          fat: Math.round(Number(meal.nutrients?.fat) || 0)
        },
        ingredients: meal.ingredients || [],
        instructions: meal.instructions || [],
        // Add any other required fields
      };

      console.log('Processed meal data:', processedMeal);

      // Use the meal type passed to the component
      const result = await onSelectMeal(processedMeal, mealType);

      if (result) {
        // Close the dialog
        onClose();

        toast.success(`Added ${meal.name} to ${mealType}`);
      }
    } catch (error) {
      console.error('Error selecting meal:', error);
      toast.error('Failed to add meal to plan. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add AI Meal to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</DialogTitle>
          <DialogDescription>
            Select a meal from your saved AI meal plans
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved meal plans..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-nuumi-pink" />
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="text-3xl">
                      {plan.plan_data?.meals?.[0]?.imageEmoji || '🍽️'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {plan.target_user === 'mother' ? 'Mother' : 'Child'} {plan.meal_type.charAt(0).toUpperCase() + plan.meal_type.slice(1)}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {plan.plan_data?.introduction || 'No description available'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-nuumi-pink/10 text-nuumi-pink px-2 py-0.5 rounded-full">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Show all meals in the plan */}
                  {plan.plan_data?.meals?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {plan.plan_data.meals.map((meal: any, index: number) => (
                        <div
                          key={index}
                          className="p-2 bg-muted/30 rounded-md cursor-pointer hover:bg-muted"
                          onClick={() => handleSelectMeal(plan, index)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{meal.imageEmoji || '🍽️'}</span>
                            <div>
                              <h5 className="text-sm font-medium">{meal.name}</h5>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {meal.benefits || 'AI-generated meal'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No saved meal plans found</p>
              <Button
                variant="outline"
                onClick={() => onClose()}
                className="mt-2"
              >
                Go to AI Planner
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SavedMealPlanSelector;
