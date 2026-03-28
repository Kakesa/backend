import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTermSystem } from '@/hooks/useTermSystem';

interface PeriodSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PeriodSelector({ 
  value, 
  onValueChange, 
  placeholder = "Sélectionner une période", 
  disabled = false,
  className 
}: PeriodSelectorProps) {
  const { periodNames } = useTermSystem();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} className={className}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {periodNames.map((periodName, index) => (
          <SelectItem key={index + 1} value={(index + 1).toString()}>
            {periodName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
