/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  UtensilsCrossed,
  Clock,
  MapPin,
  X,
  Trash2,
  Phone,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

// --- Types ---
interface Variant {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price?: number; // for simple items
  variants?: Variant[]; // for items with internal options
}

interface CartItem {
  product: MenuItem;
  variantId?: string;
  quantity: number;
}

// --- Data ---
const CATEGORIES = [
  { id: 'shawarma', name: 'الشاورما', icon: '🌯' },
  { id: 'grills', name: 'المشاوي', icon: '🍢' },
  { id: 'specials', name: 'أطباق خاصة', icon: '✨' },
  { id: 'pizza', name: 'البيتزا', icon: '🍕' },
  { id: 'osh', name: 'عش البلبل', icon: '🥧' },
  { id: 'pastries', name: 'الفطائر', icon: '🥟' },
  { id: 'appetizers', name: 'المقبلات', icon: '🥗' },
  { id: 'juices', name: 'العصائر', icon: '🥤' },
];

const MENU_ITEMS: MenuItem[] = [
  // 1. الشاورما (Shawarma)
  { id: 's1', name: 'ساندوتش شاورما', description: 'دجاج صاج تقليدي', category: 'shawarma', image: '', variants: [
    { id: 's1-v1', name: 'عادي', price: 5 },
    { id: 's1-v2', name: 'بالجبن', price: 6 },
  ]},
  { id: 's2', name: 'ساندوتش صاروخ', description: 'حجم كبير مميز', category: 'shawarma', image: '', variants: [
    { id: 's2-v1', name: 'عادي', price: 9 },
    { id: 's2-v2', name: 'بالجبن', price: 10 },
  ]},
  { id: 's3', name: 'صحن عربي', description: 'مع بطاطس وثومية', category: 'shawarma', image: '', variants: [
    { id: 's3-v1', name: 'صغير', price: 14 },
    { id: 's3-v2', name: 'عادي', price: 15 },
    { id: 's3-v3', name: 'دبل', price: 24 },
  ]},
  { id: 's4', name: 'صحن شاورما صافي', description: 'شرائح دجاج طازجة', category: 'shawarma', image: '', variants: [
    { id: 's4-v1', name: 'عادي', price: 23 },
    { id: 's4-v2', name: 'حراق 🔥', price: 24 },
  ]},
  { id: 's5', name: 'صحن أمية الشام المخصوص', description: 'تشكيلة ركن أمية الفاخرة', category: 'shawarma', image: '', variants: [
    { id: 's5-v1', name: 'عادي', price: 30 },
    { id: 's5-v2', name: 'شرائح', price: 35 },
    { id: 's5-v3', name: 'بالجبن', price: 33 },
  ]},
  { id: 's6', name: 'شاورما فرنسي', description: 'بخبز الفرنسي المميز', price: 15, category: 'shawarma', image: '' },
  { id: 's7', name: 'شاورما فرايز', description: 'بطاطس مقلية مع الشاورما والصوص', price: 15, category: 'shawarma', image: '' },

  // 2. المشويات (Grills) - Ordered as requested
  { id: 'g1', name: 'نصف على الفحم سادة', description: 'نصف دجاجة مشوية - نفر', price: 15, category: 'grills', image: '' },
  
  { id: 'g2', name: 'كباب دجاج', description: 'كباب دجاج مشوي على الفحم', category: 'grills', image: '', variants: [
    { id: 'g2-s', name: 'ساندويتش', price: 9 },
    { id: 'g2-n', name: 'نفر', price: 20 },
    { id: 'g2-k', name: 'كيلو', price: 110 },
  ]},

  { id: 'g3', name: 'شيش طاووق بالعظم', description: 'قطع دجاج بالعظم مشوية - نفر', price: 20, category: 'grills', image: '' },

  { id: 'g4', name: 'كباب لحم', description: 'كباب لحم طازج مشوي', category: 'grills', image: '', variants: [
    { id: 'g4-s', name: 'ساندويتش', price: 9 },
    { id: 'g4-n', name: 'نفر', price: 25 },
    { id: 'g4-k', name: 'كيلو', price: 140 },
  ]},

  { id: 'g5', name: 'أوصال دجاج', description: 'صدور دجاج متبلة مشوية', category: 'grills', image: '', variants: [
    { id: 'g5-s', name: 'ساندويتش', price: 10 },
    { id: 'g5-n', name: 'نفر', price: 25 },
    { id: 'g5-k', name: 'كيلو', price: 130 },
  ]},

  { id: 'g6', name: 'أوصال لحم', description: 'قطع لحم طازجة مشوية', category: 'grills', image: '', variants: [
    { id: 'g6-s', name: 'ساندويتش', price: 10 },
    { id: 'g6-n', name: 'نفر', price: 30 },
    { id: 'g6-k', name: 'كيلو', price: 150 },
  ]},

  { id: 'g7', name: 'مشوي مشكل', description: 'تشكيلة فاخرة من المشويات', category: 'grills', image: '', variants: [
    { id: 'g7-n', name: 'نفر', price: 35 },
    { id: 'g7-k', name: 'كيلو', price: 150 },
  ]},

  { id: 'g8', name: 'نفر كبدة', description: 'كبدة طازجة محمرة على الفحم', price: 30, category: 'grills', image: '' },
  { id: 'g9', name: 'دجاج على الفحم سادة', description: 'دجاجة كاملة مشوية سادة', price: 30, category: 'grills', image: '' },
  { id: 'g10', name: 'أرز', description: 'أرز طازج محضر يومياً', category: 'grills', image: '', variants: [
    { id: 'g10-b', name: 'بخاري', price: 7 },
    { id: 'g10-w', name: 'أبيض', price: 7 },
  ]},

  // 3. أطباق خاصة (Specials)
  { id: 'sp1', name: 'وجبة مشكل مشويات', description: 'تشكيلة مشويات فاخرة للمجموعات', category: 'specials', image: '', variants: [
    { id: 'sp1-3', name: '3 أشخاص', price: 70 },
    { id: 'sp1-5', name: '5 أشخاص', price: 90 },
    { id: 'sp1-7', name: '7 أشخاص', price: 150 },
  ]},
  { id: 'sp2', name: 'صفيحة شامية', description: 'لحم طازج بالعجين على الطريقة الأصلية', category: 'specials', image: '', variants: [
    { id: 'sp2-q', name: 'ربع كيلو', price: 23 },
    { id: 'sp2-h', name: 'نصف كيلو', price: 45 },
    { id: 'sp2-k', name: 'كيلو كامل', price: 90 },
  ]},
  { id: 'sp3', name: 'نفر ريش مشوية', description: 'ريش غنم طازجة مشوية على الفحم', price: 30, category: 'specials', image: '' },
  { id: 'sp4', name: 'كبة مقلية', description: 'حبة كبة مقلية مقرمشة محشية باللحم والجوز', price: 2, category: 'specials', image: '' },

  // 4. البيتزا (Pizza) - Grouped by size
  { id: 'p1', name: 'بيتزا جبن', description: 'عجينة طازجة مع جبن الموزاريلا', category: 'pizza', image: '', variants: [
    { id: 'p1-s', name: 'صغير', price: 13 },
    { id: 'p1-m', name: 'وسط', price: 19 },
    { id: 'p1-l', name: 'كبير', price: 24 },
  ]},
  { id: 'p2', name: 'بيتزا خضار', description: 'خضروات طازجة مشكلة', category: 'pizza', image: '', variants: [
    { id: 'p2-s', name: 'صغير', price: 13 },
    { id: 'p2-m', name: 'وسط', price: 19 },
    { id: 'p2-l', name: 'كبير', price: 24 },
  ]},
  { id: 'p3', name: 'بيتزا دجاج', description: 'قطع دجاج متبلة مع الخضار', category: 'pizza', image: '', variants: [
    { id: 'p3-s', name: 'صغير', price: 16 },
    { id: 'p3-m', name: 'وسط', price: 21 },
    { id: 'p3-l', name: 'كبير', price: 26 },
  ]},
  { id: 'p4', name: 'بيتزا لحم', description: 'لحم مفروم طازج', category: 'pizza', image: '', variants: [
    { id: 'p4-s', name: 'صغير', price: 16 },
    { id: 'p4-m', name: 'وسط', price: 21 },
    { id: 'p4-l', name: 'كبير', price: 26 },
  ]},
  { id: 'p5', name: 'بيتزا ببروني', description: 'شرائح ببروني بقري فاخر', category: 'pizza', image: '', variants: [
    { id: 'p5-s', name: 'صغير', price: 18 },
    { id: 'p5-m', name: 'وسط', price: 23 },
    { id: 'p5-l', name: 'كبير', price: 28 },
  ]},
  { id: 'p6', name: 'بيتزا أمية الشام', description: 'البيتزا الخاصة بالمطعم', category: 'pizza', image: '', variants: [
    { id: 'p6-s', name: 'صغير', price: 16 },
    { id: 'p6-m', name: 'وسط', price: 21 },
    { id: 'p6-l', name: 'كبير', price: 26 },
  ]},

  // 4. الفطائر (Pastries)
  { id: 'ft1', name: 'فطيرة جبنة كرفت', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft2', name: 'فطيرة لبنة', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft3', name: 'فطيرة لحم', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft4', name: 'فطيرة تونة', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft5', name: 'فطيرة دجاج', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft6', name: 'فطيرة سبانخ', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft7', name: 'فطيرة زعتر', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft8', name: 'لبنة عسل', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft9', name: 'لبنة مشكل', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft10', name: 'لبنة زيتون', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft11', name: 'لبنة خضار', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft12', name: 'لبنة زعتر', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft13', name: 'لبنة طماطم', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft14', name: 'لبنة موزريلا', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft15', name: 'لبنة سجق', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft16', name: 'لبنة بالفلفل البارد', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft17', name: 'لبنة بالجبنة والبيض', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft18', name: 'لبنة بالزعتر والزيتون', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft19', name: 'فطيرة جبن أبيض', description: '', price: 5, category: 'pastries', image: '' },
  { id: 'ft20', name: 'جبنة عسل', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft21', name: 'جبنة بالخضار', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft22', name: 'جبنة باللبنة', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft23', name: 'جبنة بالسبانخ', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft24', name: 'جبنة باللحم', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft25', name: 'جبنة بالزعتر', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft26', name: 'جبنة بالزيتون', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft27', name: 'جبنة بالبيض', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft28', name: 'جبنة بالفلفل', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft29', name: 'زعتر بالخضار', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft30', name: 'زعتر بالسبانخ', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft31', name: 'زعتر بالفلفل البارد', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft32', name: 'زعتر بالزيتون', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft33', name: 'سبانخ بالبيض', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft34', name: 'بيض باللحم', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft35', name: 'جبنة بالموزريلا', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft36', name: 'سجق بالبيض', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft37', name: 'فطيرة بطاطس', description: '', price: 6, category: 'pastries', image: '' },
  { id: 'ft38', name: 'فطيرة جبن عكاوي', description: '', price: 6, category: 'pastries', image: '' },

  // 5. عش البلبل (Osh Al-Bulbul)
  { id: 'ob1', name: 'عش البلبل زعتر', description: 'زعتر فلسطيني فاخر', category: 'osh', image: '', variants: [
    { id: 'ob1-s', name: 'صغير', price: 13 },
    { id: 'ob1-m', name: 'وسط', price: 19 },
    { id: 'ob1-l', name: 'كبير', price: 24 },
  ]},
  { id: 'ob2', name: 'عش البلبل غراب', description: 'غراب طازج ولذيذ', category: 'osh', image: '', variants: [
    { id: 'ob2-s', name: 'صغير', price: 13 },
    { id: 'ob2-m', name: 'وسط', price: 19 },
    { id: 'ob2-l', name: 'كبير', price: 24 },
  ]},
  { id: 'ob3', name: 'عش البلبل عسل', description: 'بالعسل الطبيعي والجبن', category: 'osh', image: '', variants: [
    { id: 'ob3-s', name: 'صغير', price: 13 },
    { id: 'ob3-m', name: 'وسط', price: 19 },
    { id: 'ob3-l', name: 'كبير', price: 24 },
  ]},
  { id: 'ob4', name: 'عش البلبل ساده', description: 'بدون إضافات خارجية', category: 'osh', image: '', variants: [
    { id: 'ob4-s', name: 'صغير', price: 13 },
    { id: 'ob4-m', name: 'وسط', price: 19 },
    { id: 'ob4-l', name: 'كبير', price: 24 },
  ]},
  { id: 'ob5', name: 'عش البلبل خضار', description: 'مع تشكيلة خضروات', category: 'osh', image: '', variants: [
    { id: 'ob5-s', name: 'صغير', price: 13 },
    { id: 'ob5-m', name: 'وسط', price: 19 },
    { id: 'ob5-l', name: 'كبير', price: 24 },
  ]},

  // 6. المقبلات (Appetizers)
  { id: 'a1', name: 'حمص', description: 'حمص طازج بالطحينة', category: 'appetizers', image: '', variants: [
    { id: 'a1-s', name: 'صغير', price: 6 },
    { id: 'a1-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a2', name: 'متبل', description: 'باذنجان مشوي مع الطحينة', category: 'appetizers', image: '', variants: [
    { id: 'a2-s', name: 'صغير', price: 6 },
    { id: 'a2-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a3', name: 'فتوش', description: 'سلطة خضراء مع الخبز المحمص', category: 'appetizers', image: '', variants: [
    { id: 'a3-s', name: 'صغير', price: 6 },
    { id: 'a3-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a4', name: 'بابا غنوج', description: 'مقبلات باذنجان مشوي شامية', category: 'appetizers', image: '', variants: [
    { id: 'a4-s', name: 'صغير', price: 6 },
    { id: 'a4-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a5', name: 'تبولة', description: 'بقدونس وبرغل وزيت زيتون', category: 'appetizers', image: '', variants: [
    { id: 'a5-s', name: 'صغير', price: 6 },
    { id: 'a5-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a6', name: 'بطاطا', description: 'بطاطس مقلية مقرمشة', category: 'appetizers', image: '', variants: [
    { id: 'a6-s', name: 'صغير', price: 5 },
    { id: 'a6-l', name: 'كبير', price: 10 },
  ]},
  { id: 'a7', name: 'سلطة روسية', description: 'سلطة خضار بالمايونيز', category: 'appetizers', image: '', variants: [
    { id: 'a7-s', name: 'صغير', price: 6 },
    { id: 'a7-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a8', name: 'ورق عنب', description: 'ورق عنب محشي للأرز والخدمة', category: 'appetizers', image: '', variants: [
    { id: 'a8-s', name: 'صغير', price: 6 },
    { id: 'a8-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a9', name: 'سلطة خضراء', description: 'تشكيلة خضروات طازجة', category: 'appetizers', image: '', variants: [
    { id: 'a9-s', name: 'صغير', price: 6 },
    { id: 'a9-l', name: 'كبير', price: 12 },
  ]},
  { id: 'a10', name: 'صحن مقبلات مشكل', description: 'تشكيلة من جميع أنواع المقبلات', price: 12, category: 'appetizers', image: '' },
  { id: 'a11', name: 'صحن مقبلات أمية الشام', description: 'صحن المقبلات الملكي الفاخر', price: 30, category: 'appetizers', image: '' },

  // 7. العصائر والمشروبات (Juices & Drinks)
  { id: 'j1', name: 'عصير مشكل', description: 'تشكيلة فواكه طازجة', category: 'juices', image: '', variants: [
    { id: 'j1-s', name: 'صغير', price: 5 },
    { id: 'j1-m', name: 'وسط', price: 8 },
    { id: 'j1-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j2', name: 'عصير مانجو', description: 'مانجو طبيعي بارد', category: 'juices', image: '', variants: [
    { id: 'j2-s', name: 'صغير', price: 5 },
    { id: 'j2-m', name: 'وسط', price: 8 },
    { id: 'j2-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j3', name: 'عصير جوافة', description: 'جوافة طازجة منعشة', category: 'juices', image: '', variants: [
    { id: 'j3-s', name: 'صغير', price: 5 },
    { id: 'j3-m', name: 'وسط', price: 8 },
    { id: 'j3-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j4', name: 'عصير فراولة', description: 'فراولة طازجة باردة', category: 'juices', image: '', variants: [
    { id: 'j4-s', name: 'صغير', price: 5 },
    { id: 'j4-m', name: 'وسط', price: 8 },
    { id: 'j4-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j5', name: 'عصير شمام', description: 'شمام طبيعي منعش', category: 'juices', image: '', variants: [
    { id: 'j5-s', name: 'صغير', price: 5 },
    { id: 'j5-m', name: 'وسط', price: 8 },
    { id: 'j5-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j6', name: 'عصير موز', description: 'موز طازج مخفوق', category: 'juices', image: '', variants: [
    { id: 'j6-s', name: 'صغير', price: 5 },
    { id: 'j6-m', name: 'وسط', price: 8 },
    { id: 'j6-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j7', name: 'موز وحليب', description: 'موز بالحليب الطازج', category: 'juices', image: '', variants: [
    { id: 'j7-s', name: 'صغير', price: 5 },
    { id: 'j7-m', name: 'وسط', price: 8 },
    { id: 'j7-g', name: 'جالون', price: 20 },
  ]},
  { id: 'j8', name: 'عصير برتقال', description: 'برتقال طبيعي 100%', category: 'juices', image: '', variants: [
    { id: 'j8-s', name: 'صغير', price: 6 },
    { id: 'j8-m', name: 'وسط', price: 9 },
    { id: 'j8-g', name: 'جالون', price: 30 },
  ]},
  { id: 'j9', name: 'بيبسي', description: 'مشروب غازي بيبسي', price: 3, category: 'juices', image: '' },
  { id: 'j10', name: 'بيبسي عائلي/وسط', description: 'أحجام عائلية للمشاركة', category: 'juices', image: '', variants: [
    { id: 'j10-m', name: 'وسط', price: 6 },
    { id: 'j10-f', name: 'عائلي', price: 10 },
  ]},
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // --- Logic ---
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((sum, item) => {
    const itemPrice = item.variantId 
      ? (item.product.variants?.find(v => v.id === item.variantId)?.price || 0)
      : (item.product.price || 0);
    return sum + (itemPrice * item.quantity);
  }, 0), [cart]);

  const addToCart = (product: MenuItem, variantId?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variantId === variantId);
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.variantId === variantId) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, variantId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number, variantId?: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.variantId === variantId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const sendToWhatsApp = async () => {
    setIsSending(true);
    const restaurantPhone = "966568604336"; 
    
    // 1. Get Items List
    const itemsList = cart.map(item => {
      const variant = item.variantId ? item.product.variants?.find(v => v.id === item.variantId) : null;
      return `- ${item.product.name} ${variant ? `[${variant.name}]` : ''} (x${item.quantity})`;
    }).join('\n');

    // 2. Try to get Location
    let locationLink = "";
    try {
      // 5 second timeout to avoid keeping user waiting too long
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
        } else {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            timeout: 5000, 
            enableHighAccuracy: true 
          });
        }
      });
      locationLink = `\n\n📍 *موقع العميل (قوقل ماب):*\nhttps://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
    } catch (error) {
      console.log("Could not get location:", error);
      locationLink = "\n\n⚠️ *ملاحظة: لم يتمكن النظام من تحديد الموقع تلقائياً. يرجى إرسال الموقع يدوياً.*";
    }

    // 3. Construct Message
    const message = `طلب جديد من مطعم ركن أمية الشام:\n\n${itemsList}\n\n*المجموع الكلي: ${totalPrice} ريال*${locationLink}`;
    
    // 4. Save to Supabase (Optional Record)
    if (supabase) {
      try {
        await supabase.from('orders').insert([
          { 
            items: itemsList, 
            total_price: totalPrice, 
            location_link: locationLink.replace('\n\n📍 *موقع العميل (قوقل ماب):*\n', '').replace('\n\n⚠️ *ملاحظة: لم يتمكن النظام من تحديد الموقع تلقائياً. يرجى إرسال الموقع يدوياً.*', 'N/A')
          }
        ]);
        console.log("Order saved to database.");
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
      }
    }

    // 5. Open WhatsApp
    const url = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setIsSending(false);
  };

  const setActiveCategoryAndScroll = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(`cat-${id}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
    const itemsContainer = document.getElementById('items-container');
    if (itemsContainer) {
      itemsContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen selection:bg-orange-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* --- Header & Information --- */}
        <header className="relative w-full h-56 flex-shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=600&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            alt="Restaurant"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <h1 className="text-3xl font-black mb-0">ركن أمية الشام</h1>
              <p className="text-[10px] font-bold text-amber-400 mb-2 uppercase tracking-wider">Umayyah ALsham Corner Restaurant</p>
              <div className="flex flex-col gap-1 text-xs text-amber-200">
                {/* Information removed based on user request */}
              </div>
            </motion.div>
          </div>
        </header>

        {/* --- Top Left Animated Floating Cart --- */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0, x: -20 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                x: 0,
                y: [0, -5, 0] // Gentle floating motion
              }}
              exit={{ scale: 0, opacity: 0, x: -20 }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              onClick={() => setIsCartOpen(true)}
              className="fixed top-52 left-4 z-40 bg-amber-400 text-[#7c2d12] p-3 rounded-full shadow-2xl border-4 border-white flex items-center justify-center group"
            >
              <div className="relative">
                <ShoppingCart size={28} strokeWidth={3} />
                <motion.span 
                  key={totalItems}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 -right-3 bg-[#7c2d12] text-white text-[12px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {totalItems}
                </motion.span>
              </div>
              
              {/* Subtle Pulse Halo */}
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-amber-400 -z-10"
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* --- Category Quick Select (Centered Scroll) --- */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
          <div 
            className="flex overflow-x-auto no-scrollbar py-3 px-[40%]" 
            style={{ 
              scrollSnapType: 'x proximity',
              scrollPaddingInline: '40%'
            }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                id={`cat-${cat.id}`}
                onClick={() => setActiveCategoryAndScroll(cat.id)}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-full whitespace-nowrap transition-all text-sm font-bold mx-1
                  ${activeCategory === cat.id 
                    ? 'bg-[#7c2d12] text-white shadow-lg scale-100' 
                    : 'bg-slate-50 text-slate-400 scale-95'}
                `}
                style={{ scrollSnapAlign: 'center' }}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- Items List --- */}
        <div id="items-container" className="flex-grow overflow-y-auto px-1 pt-4 pb-48 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 px-3"
            >
              {MENU_ITEMS.filter(item => item.category === activeCategory).map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                      {item.name}
                      {item.description.includes('🔥') && <span className="text-sm">🔥</span>}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                  </div>

                  {/* Rendering simple item vs item with variants */}
                  {item.variants ? (
                    <div className="px-4 pb-4 grid grid-cols-1 gap-2">
                      {item.variants.map(variant => {
                        const quantity = cart.find(c => c.product.id === item.id && c.variantId === variant.id)?.quantity || 0;
                        return (
                          <div key={variant.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-500">{variant.name}</span>
                               <span className="text-[#ca8a04] font-black text-sm">{variant.price} ر.س</span>
                             </div>
                             <div className="flex items-center gap-3">
                               {quantity > 0 ? (
                                 <div className="flex items-center gap-2 bg-[#7c2d12] rounded-full px-2 py-1 shadow-lg border border-[#9a3412]">
                                   <button onClick={() => addToCart(item, variant.id)} className="text-amber-400 p-0.5"><Plus size={14} strokeWidth={3} /></button>
                                   <span className="text-xs font-black w-4 text-center text-white">{quantity}</span>
                                   <button onClick={() => updateQuantity(item.id, -1, variant.id)} className="text-amber-400/70 p-0.5"><Minus size={14} strokeWidth={3} /></button>
                                 </div>
                               ) : (
                                 <button onClick={() => addToCart(item, variant.id)} className="bg-slate-100 text-slate-500 p-2 rounded-full shadow-sm hover:bg-amber-100 hover:text-[#7c2d12] transition-colors border border-slate-200">
                                   <Plus size={16} strokeWidth={3} />
                                 </button>
                               )}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 pb-4 flex items-center justify-between mt-1">
                      <span className="text-[#ca8a04] font-black text-lg">{item.price} <small className="text-[10px] font-normal">ريال</small></span>
                      <div className="flex items-center gap-3">
                        {cart.find(c => c.product.id === item.id)?.quantity ? (
                          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200">
                            <button onClick={() => addToCart(item)} className="text-green-600 p-0.5"><Plus size={16} strokeWidth={3} /></button>
                            <span className="text-sm font-black w-4 text-center">{cart.find(c => c.product.id === item.id)?.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-red-500 p-0.5"><Minus size={16} strokeWidth={3} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} className="bg-slate-100 text-slate-500 p-2.5 rounded-full shadow-sm hover:bg-amber-100 hover:text-[#7c2d12] transition-colors border border-slate-200">
                             <Plus size={20} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* --- Footer Contact Info --- */}
          <footer className="mt-12 mb-10 px-6 py-8 bg-slate-50 rounded-[32px] border border-slate-100 text-center space-y-4">
            <div className="flex flex-col gap-1 items-center">
              <h2 className="font-black text-xl text-[#7c2d12] leading-none">ركن أمية الشام</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Umayyah ALsham Corner Restaurant</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-bold">
              نسعد بخدمتكم وتلبية طلباتكم بأفضل جودة وأنسب الأسعار
            </p>
            
            <div className="flex flex-col gap-3 pt-2">
              <a 
                href="https://maps.google.com/?q=ركن+أمية+الشام+ينبع" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-slate-700 hover:bg-orange-50 transition-colors"
              >
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><MapPin size={18} /></div>
                <span className="text-xs font-bold text-right">ينبع البحر - حي المشهد - إشارة الدلة</span>
              </a>

              <a 
                href="tel:0555192109" 
                className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-slate-700 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Phone size={18} /></div>
                  <span className="text-xs font-bold">للاتصال المباشر</span>
                </div>
                <span className="font-mono font-bold text-sm">0555192109</span>
              </a>
            </div>

            <div className="pt-8 border-t border-slate-200 flex flex-col items-center gap-2">
              <p className="text-[10px] text-slate-400 font-bold">جميع الحقوق محفوظة © ركن أمية الشام 2024</p>
              <a 
                href="https://wa.me/966540334697" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm font-black text-slate-900 hover:text-[#7c2d12] transition-colors flex items-center gap-2"
              >
                <span className="bg-slate-100 px-3 py-1 rounded-lg">تصميم QUI</span>
                <span className="font-mono">0540334697</span>
              </a>
            </div>
          </footer>
        </div>

        {/* --- Cart Bar --- */}
        {/* Removed redundant bottom bar since we have the floating cart */}

        {/* --- Cart Modal --- */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" 
              />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="relative w-full max-w-md mx-auto bg-white rounded-t-[32px] max-h-[90vh] flex flex-col shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
                <div className="px-6 flex justify-between items-center pb-4 border-b border-slate-50 font-black text-xl shrink-0">
                  <span>مراجعة طلباتك</span>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors pointer-events-auto"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto px-6 py-4 space-y-4 flex-grow overscroll-contain">
                  {cart.map(item => {
                    const variant = item.variantId ? item.product.variants?.find(v => v.id === item.variantId) : null;
                    const price = variant ? variant.price : (item.product.price || 0);
                    return (
                      <div key={`${item.product.id}-${item.variantId}`} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex-grow">
                          <h4 className="text-sm font-bold">{item.product.name}</h4>
                          {variant && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">{variant.name}</span>}
                          <p className="text-xs text-amber-700 font-black mt-1">{price * item.quantity} ريال</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl px-2 py-1 shadow-sm">
                          <button onClick={() => updateQuantity(item.product.id, -1, item.variantId)} className="text-slate-400 p-1"><Minus size={14} /></button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => addToCart(item.product, item.variantId)} className="text-[#7c2d12] p-1"><Plus size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 bg-white border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-slate-500">إجمالي الحساب</span>
                    <span className="font-black text-2xl">{totalPrice} ريال</span>
                  </div>
                  <button 
                    onClick={sendToWhatsApp}
                    disabled={isSending}
                    className="w-full bg-[#25D366] text-white py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all border-b-4 border-[#128C7E] disabled:opacity-75 disabled:cursor-wait"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="animate-spin" size={24} /> جاري تحديد الموقع...
                      </>
                    ) : (
                      <>
                        <MessageSquare fill="currentColor" size={24} /> تأكيد الطلب
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
