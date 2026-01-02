import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode, isValidElement } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  darkText?: boolean;
  icon: LucideIcon | ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent';
}

export function StatCard({ title, value, subtitle, darkText, icon, trend, variant = 'default' }: StatCardProps) {
  const renderIcon = () => {
    if (isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="h-6 w-6" />;
  };
  return (
    <div className={cn(
      "stat-card animate-fade-in",
      variant === 'primary' && "olive-gradient text-primary-foreground",
      variant === 'accent' && "golden-gradient text-accent-foreground"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            darkText ? "text-foreground" : (variant === 'default' ? "text-muted-foreground" : "opacity-80")
          )}>
            {title}
          </p>
          <p className={cn(
            "mt-2 text-3xl font-semibold font-serif",
            darkText && "text-foreground"
          )}>{value}</p>
          {subtitle && (
            <p className={cn(
              "mt-1 text-sm",
              darkText ? "text-foreground font-medium" : (variant === 'default' ? "text-muted-foreground" : "opacity-70")
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              "mt-2 text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          variant === 'default' ? "bg-primary/10 text-primary" : "bg-white/20"
        )}>
          {renderIcon()}
        </div>
      </div>
    </div>
  );
}
