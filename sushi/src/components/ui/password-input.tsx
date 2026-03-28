import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { validatePassword, getPasswordStrength } from "@/lib/passwordValidation";

interface PasswordInputProps extends React.ComponentProps<"input"> {
  showValidation?: boolean;
  showStrength?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showValidation = false, showStrength = false, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState("");
    
    const password = (value as string) ?? internalValue;
    const validation = validatePassword(password);
    const strength = getPasswordStrength(password);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const requirements = [
      { label: "8 caractères minimum", test: password.length >= 8 },
      { label: "Une majuscule", test: /[A-Z]/.test(password) },
      { label: "Une minuscule", test: /[a-z]/.test(password) },
      { label: "Un chiffre", test: /[0-9]/.test(password) },
      { label: "Un caractère spécial", test: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            value={value}
            onChange={handleChange}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {showStrength && password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    level <= strength.strength ? strength.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className={cn("text-xs", strength.color.replace("bg-", "text-").replace("-500", "-600"))}>
              Force: {strength.label}
            </p>
          </div>
        )}
        
        {showValidation && password.length > 0 && (
          <ul className="space-y-1 text-xs">
            {requirements.map((req, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-1.5",
                  req.test ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {req.test ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
