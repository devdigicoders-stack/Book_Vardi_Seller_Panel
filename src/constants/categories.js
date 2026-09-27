export const CATEGORY_STRUCTURE = [
  {
    id: 'School Uniform',
    name: 'School Uniform',
    subCategories: ['Ready to wear', 'Unstitched', 'Winter wear', 'Sports Wear']
  },
  {
    id: 'Books',
    name: 'Books',
    subCategories: ['NCERT Books', 'Private Publisher Book', 'Practice & Olympiad Books']
  },
  {
    id: 'Notebook & Stationary',
    name: 'Notebook & Stationary',
    subCategories: ['Notebooks and Register', 'General Stationary', 'Drawing and supplies']
  },
  {
    id: 'Footwear',
    name: 'Footwear',
    subCategories: ['School shoes', 'School Socks']
  },
  {
    id: 'School Bags And Kit',
    name: 'School Bags And Kit',
    subCategories: ['School Bags', 'Kit and Bundle']
  }
];

export function normalizeCategory(catName) {
  if (!catName) return 'School Uniform';
  const lower = String(catName).toLowerCase().trim();
  if (lower === 'school uniform' || lower === 'uniforms' || lower === 'uniform') return 'School Uniform';
  if (lower === 'books' || lower === 'ncert' || lower === 'practice_books' || lower === 'drawing_books') return 'Books';
  if (lower === 'notebook & stationary' || lower === 'notebooks & paper crafts' || lower === 'stationery' || lower === 'notebooks' || lower === 'writing' || lower === 'drawing' || lower === 'notebook & stationery') return 'Notebook & Stationary';
  if (lower === 'footwear' || lower === 'shoes & socks' || lower === 'shoes') return 'Footwear';
  if (lower === 'school bags and kit' || lower === 'school bags & backpacks' || lower === 'bags' || lower === 'rain_winter' || lower === 'kits') return 'School Bags And Kit';
  
  const matched = CATEGORY_STRUCTURE.find(c => c.name.toLowerCase() === lower || c.id.toLowerCase() === lower);
  if (matched) return matched.name;

  return 'School Uniform';
}

export function getSubCategories(catName) {
  const norm = normalizeCategory(catName);
  const found = CATEGORY_STRUCTURE.find(c => c.name.toLowerCase() === norm.toLowerCase());
  return found ? found.subCategories : [];
}

export const CATEGORIES = CATEGORY_STRUCTURE.map(c => ({ id: c.id, name: c.name }));
