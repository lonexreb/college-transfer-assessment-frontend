import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AssessmentCriteria } from "@/data/mockData";

interface WeightSliderProps {
  criteria: AssessmentCriteria;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const WeightSlider = ({ criteria, value, onChange, disabled = false }: WeightSliderProps) => {
  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    onChange(newValue);
  };

  return (
    <Card className={disabled ? "opacity-50" : ""}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{criteria.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{criteria.description}</p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={handleInputChange}
                disabled={disabled}
                className="w-16 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Slider
              value={[value]}
              onValueChange={handleSliderChange}
              max={100}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightSlider;