import {
  BookOpen, Dumbbell, Heart, Brain, Coffee, Droplets,
  Sun, Moon, Apple, Pencil, Music, Code,
  Target, Zap, Flame, Leaf, Eye, Smile,
  PersonStanding, Bed, GlassWater, Salad, Pill, Bike,
  LucideIcon, Circle,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'dumbbell': Dumbbell,
  'heart': Heart,
  'brain': Brain,
  'coffee': Coffee,
  'droplets': Droplets,
  'sun': Sun,
  'moon': Moon,
  'apple': Apple,
  'pencil': Pencil,
  'music': Music,
  'code': Code,
  'target': Target,
  'zap': Zap,
  'flame': Flame,
  'leaf': Leaf,
  'eye': Eye,
  'smile': Smile,
  'run': PersonStanding,
  'bed': Bed,
  'glass-water': GlassWater,
  'salad': Salad,
  'pill': Pill,
  'bike': Bike,
};

export const getHabitIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

export const allHabitIconNames = Object.keys(iconMap);
