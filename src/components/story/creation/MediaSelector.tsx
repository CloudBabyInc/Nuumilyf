
import React from 'react';
import { Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaSelectorProps {
  onSelectMediaType: (type: 'image' | 'video') => void;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  onSelectMediaType
}) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
      <Button
        variant="outline"
        size="lg"
        className="flex-1 flex flex-col items-center py-8 gap-2"
        onClick={() => onSelectMediaType('image')}
      >
        <Image size={32} />
        <span>Image</span>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="flex-1 flex flex-col items-center py-8 gap-2"
        onClick={() => onSelectMediaType('video')}
      >
        <Video size={32} />
        <span>Video</span>
      </Button>
    </div>
  );
};

export default MediaSelector;
