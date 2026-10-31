import {
  BookOpenCheck,
  Boxes,
  Palette,
  Search,
  WalletCards,
} from 'lucide-react'

export const baseCourses = [
  {
    id: 'phulkari-foundations',
    category: 'Embroidery',
    title: 'Phulkari embroidery: foundations and first motifs',
    description:
      'Learn the tools, fabric preparation, and stitch rhythm behind expressive Phulkari work.',
    duration: '1 hr 20 min',
    lessons: [
      'Getting to know the fabric and tools',
      'Preparing a practice sampler',
      'Building your first Phulkari motif',
    ],
    level: 'Beginner',
    instructor: 'Sana Iqbal',
    expertise: 'Textile artist and embroidery educator',
    icon: Palette,
    outcomes: [
      'Choose fabric and thread for a sampler',
      'Practice foundational stitches',
      'Plan a balanced first motif',
    ],
  },
  {
    id: 'textile-color-stories',
    category: 'Textiles',
    title: 'Color and story in traditional textiles',
    description:
      'Explore how color, repetition, and local motifs can carry meaning through handmade textile work.',
    duration: '55 min',
    lessons: [
      'Reading color relationships',
      'Finding inspiration in local motifs',
      'Composing a repeating pattern',
    ],
    level: 'All levels',
    instructor: 'Sana Iqbal',
    expertise: 'Textile artist and embroidery educator',
    icon: BookOpenCheck,
    outcomes: [
      'Build a small color palette',
      'Develop a motif from observation',
      'Create a repeat pattern',
    ],
  },
  {
    id: 'clay-to-form',
    category: 'Pottery',
    title: 'From clay to form: hand-building basics',
    description:
      'A practical introduction to preparing clay and shaping simple, sturdy handmade forms.',
    duration: '1 hr 10 min',
    lessons: [
      'Preparing and wedging clay',
      'Pinch and coil techniques',
      'Finishing and drying safely',
    ],
    level: 'Beginner',
    instructor: 'Pottery expert',
    expertise: 'Ceramics instructor · Profile coming soon',
    icon: Boxes,
    outcomes: [
      'Prepare clay for hand-building',
      'Shape simple pinch and coil forms',
      'Understand drying and finishing basics',
    ],
  },
  {
    id: 'natural-dyes',
    category: 'Weaving',
    title: 'Natural dyeing for yarn and fabric',
    description:
      'Learn a careful approach to preparing fibers and experimenting with natural color sources.',
    duration: '50 min',
    lessons: [
      'Preparing fibers for dye',
      'Exploring plant-based color',
      'Keeping a sample and color journal',
    ],
    level: 'Beginner',
    instructor: 'Textile craft expert',
    expertise: 'Natural dyes and fiber arts · Profile coming soon',
    icon: Palette,
    outcomes: [
      'Prepare yarn and fabric samples',
      'Test color from natural materials',
      'Record repeatable dye experiments',
    ],
  },
  {
    id: 'photograph-your-craft',
    category: 'Shop growth',
    title: 'Photograph your craft with a phone',
    description:
      'Use everyday light, simple backgrounds, and close-up details to present handmade pieces.',
    duration: '45 min',
    lessons: [
      'Finding soft natural light',
      'Choosing a simple background',
      'Capturing detail and scale',
    ],
    level: 'Beginner',
    instructor: 'Product photography expert',
    expertise: 'Creative product photography · Profile coming soon',
    icon: Search,
    outcomes: [
      'Set up a natural-light photo area',
      'Choose a clean background',
      'Capture useful detail shots',
    ],
  },
  {
    id: 'pricing-handmade-work',
    category: 'Shop growth',
    title: 'Price your handmade work',
    description:
      'Build prices around materials, time, and the value of your craft with confidence.',
    duration: '60 min',
    lessons: [
      'Calculating material costs',
      'Valuing your time',
      'Setting a sustainable price',
    ],
    level: 'Beginner',
    instructor: 'Small business expert',
    expertise: 'Creative business and pricing · Profile coming soon',
    icon: WalletCards,
    outcomes: [
      'Calculate material and labor costs',
      'Set a sustainable selling price',
      'Explain the value behind your work',
    ],
  },
]
