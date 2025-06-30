import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'accent' | 'success';
  trend?: {
    value: number;
    label: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-500 to-accent-600',
    success: 'from-success-500 to-success-600',
  };

  const backgroundClasses = {
    primary: 'bg-primary-50',
    secondary: 'bg-secondary-50',
    accent: 'bg-accent-50',
    success: 'bg-success-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value.toLocaleString()}</p>
          {trend && (
            <div className="flex items-center">
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${backgroundClasses[color]} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 bg-gradient-to-br ${colorClasses[color]} bg-clip-text text-transparent`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;