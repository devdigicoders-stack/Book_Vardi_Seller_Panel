// Mock data for Book Vardi frontend matching the design layout with INR (₹ / Rs) pricing

export const ANNOUNCEMENTS = [
  { icon: 'Truck', text: 'Free Shipping on Orders Over ₹499' },
  { icon: 'Tag', text: '10% OFF Your First Order | Use Code: SCHOOL10' },
  { icon: 'RotateCcw', text: '30-Day Hassle-Free Returns' }
];

export const NAV_LINKS = [
  { label: 'Home', view: 'home' },
  { label: 'Categories', view: 'categories' },
  { label: 'All Products', view: 'products' },
  { label: 'Seller Hub', view: 'seller-dashboard' },
  { label: 'About Us', view: 'about' },
  { label: 'Contact Us', view: 'contact' }
];

export const VALUE_PROPS = [
  {
    id: 1,
    icon: 'Truck',
    title: 'FREE SHIPPING',
    subtitle: 'On Orders Over ₹499'
  },
  {
    id: 2,
    icon: 'ShieldCheck',
    title: 'SECURE PAYMENT',
    subtitle: '100% UPI & Cards Checkout'
  },
  {
    id: 3,
    icon: 'Award',
    title: 'PREMIUM QUALITY',
    subtitle: 'Carefully Selected'
  },
  {
    id: 4,
    icon: 'RotateCcw',
    title: 'EASY RETURNS',
    subtitle: '30-Day Hassle Free Returns'
  },
  {
    id: 5,
    icon: 'Headphones',
    title: '24/7 SUPPORT',
    subtitle: "We're Here to Help"
  }
];

export const CATEGORIES = [
  {
    id: 'uniforms',
    name: 'SCHOOL UNIFORMS',
    itemCount: '200+ Items',
    accentColor: 'var(--color-brand-blue)',
    bgColor: 'var(--color-brand-blue-subtle)',
    icon: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'ncert',
    name: 'NCERT BOOKS',
    itemCount: '150+ Books',
    accentColor: 'var(--color-brand-teal)',
    bgColor: 'var(--color-brand-teal-subtle)',
    icon: 'BookOpen',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'practice_books',
    name: 'PRACTICE BOOKS',
    itemCount: '120+ Books',
    accentColor: 'var(--color-brand-ochre)',
    bgColor: 'var(--color-brand-ochre-subtle)',
    icon: 'BookMarked',
    imageUrl: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'drawing_books',
    name: 'DRAWING FOR KIDS',
    itemCount: '80+ Items',
    accentColor: 'var(--color-brand-pink)',
    bgColor: 'var(--color-brand-pink-subtle)',
    icon: 'Palette',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'school_specific',
    name: 'SCHOOL SPECIFIC',
    itemCount: '50+ Schools',
    accentColor: 'var(--color-brand-yellow)',
    bgColor: 'var(--color-brand-yellow-subtle)',
    icon: 'Building',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'sports',
    name: 'SPORTS',
    itemCount: '100+ Items',
    accentColor: 'var(--color-brand-blue)',
    bgColor: 'var(--color-brand-blue-subtle)',
    icon: 'Activity',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'shoes',
    name: 'SHOES',
    itemCount: '60+ Pairs',
    accentColor: 'var(--color-brand-teal)',
    bgColor: 'var(--color-brand-teal-subtle)',
    icon: 'Circle',
    imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'winter',
    name: 'WINTER WEAR',
    itemCount: '80+ Items',
    accentColor: 'var(--color-brand-pink)',
    bgColor: 'var(--color-brand-pink-subtle)',
    icon: 'CloudSnow',
    imageUrl: 'https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'rain',
    name: 'RAIN GEAR',
    itemCount: '30+ Items',
    accentColor: 'var(--color-brand-ochre)',
    bgColor: 'var(--color-brand-ochre-subtle)',
    icon: 'CloudRain',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'supplies',
    name: 'STATIONERY',
    itemCount: '95+ Items',
    accentColor: 'var(--color-brand-teal)',
    bgColor: 'var(--color-brand-teal-subtle)',
    icon: 'PenTool',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'bags',
    name: 'BAGS & CASES',
    itemCount: '45+ Items',
    accentColor: 'var(--color-brand-blue)',
    bgColor: 'var(--color-brand-blue-subtle)',
    icon: 'Briefcase',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'kits',
    name: 'KITS & BUNDLES',
    itemCount: '12+ Bundles',
    accentColor: 'var(--color-brand-ochre)',
    bgColor: 'var(--color-brand-ochre-subtle)',
    icon: 'Package',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=300&auto=format&fit=crop&q=80'
  }
];

export const BEST_SELLERS = [
  {
    id: 1,
    name: 'DPS Summer Uniform Set (Boys)',
    subtitle: 'White Shirt & Grey Shorts • Cotton Blend',
    category: 'uniforms',
    price: 899,
    originalPrice: 1199,
    discountBadge: '25% OFF',
    rating: 4.9,
    reviewsCount: 1245,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'KV Winter Uniform Sweater (Unisex)',
    subtitle: 'Navy Blue V-Neck • 100% Warm Wool',
    category: 'uniforms',
    price: 949,
    originalPrice: 1299,
    discountBadge: '26% OFF',
    rating: 4.8,
    reviewsCount: 2153,
    inStock: true,
    image: 'https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    name: 'NCERT Mathematics Class 10',
    subtitle: 'Latest Edition • CBSE Board',
    category: 'ncert',
    price: 160,
    originalPrice: 160,
    discountBadge: 'BESTSELLER',
    rating: 4.9,
    reviewsCount: 1782,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    name: 'NCERT Science Class 9',
    subtitle: 'Latest Edition • CBSE Board',
    category: 'ncert',
    price: 150,
    originalPrice: 150,
    discountBadge: 'POPULAR',
    rating: 4.9,
    reviewsCount: 1012,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 5,
    name: 'Olympiad Reasoning Practice Book',
    subtitle: 'Class 5-8 • Logical & Quantitative',
    category: 'practice_books',
    price: 249,
    originalPrice: 349,
    discountBadge: 'SALE',
    rating: 4.7,
    reviewsCount: 943,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 6,
    name: 'Kids Magic Coloring & Drawing Book',
    subtitle: 'Water Reveal • Reusable Pages',
    category: 'drawing_books',
    price: 299,
    originalPrice: 499,
    discountBadge: '40% OFF',
    rating: 5.0,
    reviewsCount: 1317,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 7,
    name: 'Girls Pleated Skirt Uniform',
    subtitle: 'Any School Standard • Poly Viscose',
    category: 'uniforms',
    price: 649,
    originalPrice: 899,
    discountBadge: '27% OFF',
    rating: 4.9,
    reviewsCount: 885,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1588622153496-c67bfae6f4df?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 8,
    name: 'Premium Sticky Notes Palette',
    subtitle: 'Self-Adhesive • 6 Pastel Tone Pads',
    category: 'supplies',
    price: 129,
    originalPrice: 199,
    discountBadge: 'NEW',
    rating: 4.8,
    reviewsCount: 654,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80'
  }
];

// Expanded 32+ products for the dedicated All Products Infinite Scroll Catalog
export const KIT_BUNDLES = [
  {
    id: 1001,
    name: 'Back-to-School Summer Kit',
    school: 'Any School',
    className: 'Class 5',
    subtitle: 'Summer Uniform + Shoes + Backpack + NCERT Books',
    category: 'kits',
    price: 3199,
    originalPrice: 4247,
    discountBadge: 'BUNDLE DEAL',
    rating: 4.9,
    reviewsCount: 640,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=900&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80'
    ],
    kitItems: [
      { id: 1, name: 'Boys Summer Uniform Set', price: 899, image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500&auto=format&fit=crop&q=80' },
      { id: 4, name: 'Black Leather School Shoes', price: 799, image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&auto=format&fit=crop&q=80' },
      { id: 11, name: 'Class 5 NCERT Textbook Bundle', price: 850, image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80' },
      { id: 20, name: 'Ergonomic Student Backpack', price: 1199, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 1002,
    name: 'Board Exam Revision Kit',
    school: 'Any School',
    className: 'Class 10',
    subtitle: '10-Year Question Bank + Geometry Box + Gel Pens',
    category: 'kits',
    price: 799,
    originalPrice: 898,
    discountBadge: 'TOP PICK',
    rating: 5.0,
    reviewsCount: 710,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=900&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=900&auto=format&fit=crop&q=80'
    ],
    kitItems: [
      { id: 15, name: 'Class 10 CBSE 10-Year Question Bank', price: 499, image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=80' },
      { id: 18, name: 'Precision Geometry Compass Box', price: 249, image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=500&auto=format&fit=crop&q=80' },
      { id: 17, name: 'Premium Gel Pens (Pack of 10)', price: 150, image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 1003,
    name: 'Creative Artist Starter Kit',
    school: 'Ryan International',
    className: 'Class 8',
    subtitle: 'Sketch Book + Magic Water Book + Water Bottle',
    category: 'kits',
    price: 949,
    originalPrice: 1097,
    discountBadge: 'CREATIVE BUNDLE',
    rating: 4.9,
    reviewsCount: 540,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&auto=format&fit=crop&q=80'
    ],
    kitItems: [
      { id: 13, name: 'Kids Magic Water Coloring Book', price: 299, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80' },
      { id: 14, name: 'A4 Sketch Book', price: 199, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80' },
      { id: 19, name: 'Stainless Steel Water Bottle', price: 599, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 1004,
    name: 'DPS Winter Sports Kit',
    school: 'Delhi Public School',
    className: 'Class 5',
    subtitle: 'Tracksuit + PT Shoes + Winter Muffler',
    category: 'kits',
    price: 1899,
    originalPrice: 2197,
    discountBadge: 'WINTER READY',
    rating: 4.8,
    reviewsCount: 312,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&auto=format&fit=crop&q=80'
    ],
    kitItems: [
      { id: 3, name: 'Unisex Sports Tracksuit', price: 1299, image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=80' },
      { id: 5, name: 'White Canvas PT Shoes', price: 499, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&auto=format&fit=crop&q=80' },
      { id: 10, name: 'Winter Muffler & Beanie Set', price: 399, image: 'https://images.unsplash.com/photo-1579910404018-971eb05e83ea?w=500&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 1005,
    name: 'Kendriya Vidyalaya Monsoon Kit',
    school: 'Kendriya Vidyalaya',
    className: 'Class 3',
    subtitle: 'Raincoat + Water Bottle + Cursive Practice Book',
    category: 'kits',
    price: 1299,
    originalPrice: 1428,
    discountBadge: 'MONSOON BUNDLE',
    rating: 4.8,
    reviewsCount: 428,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=900&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=900&auto=format&fit=crop&q=80'
    ],
    kitItems: [
      { id: 8, name: 'Kids Waterproof Raincoat', price: 649, image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&auto=format&fit=crop&q=80' },
      { id: 19, name: 'Stainless Steel Water Bottle', price: 599, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80' },
      { id: 16, name: 'Cursive Handwriting Practice Set', price: 180, image: 'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=500&auto=format&fit=crop&q=80' }
    ]
  }
];

export const ALL_PRODUCTS = [
  {
    "id": 1,
    "name": "Boys Summer Uniform Set (White/Navy)",
    "subtitle": "Classic half-sleeve shirt with navy shorts",
    "price": 899,
    "originalPrice": 1099,
    "rating": 4.8,
    "reviews": 124,
    "image": "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500&auto=format&fit=crop&q=80",
    "category": "uniforms",
    "badge": "BESTSELLER",
    "schoolSpecific": false,
    "stockQuantity": 85,
    "inStock": true
  },
  {
    "id": 2,
    "name": "Girls Tunic Dress Uniform (Checkered)",
    "subtitle": "Comfortable knee-length pleated tunic",
    "price": 949,
    "originalPrice": 1199,
    "rating": 4.9,
    "reviews": 89,
    "image": "https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&auto=format&fit=crop&q=80",
    "category": "uniforms",
    "schoolSpecific": false
  },
  {
    "id": 3,
    "name": "Unisex Sports Tracksuit (Blue/White)",
    "subtitle": "Breathable polyester PT tracksuit",
    "price": 1299,
    "originalPrice": 1599,
    "rating": 4.7,
    "reviews": 210,
    "image": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=80",
    "category": "sports",
    "badge": "NEW ARRIVAL",
    "approvalStatus": "Pending",
    "approvalComment": "waiit",
    "rejectionReason": null
  },
  {
    "id": 4,
    "name": "Black Leather School Shoes (Lace-up)",
    "subtitle": "Durable anti-slip sole for daily wear",
    "price": 799,
    "originalPrice": 999,
    "rating": 4.6,
    "reviews": 340,
    "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&auto=format&fit=crop&q=80",
    "category": "shoes",
    "approvalStatus": "Pending",
    "approvalComment": "wait.........",
    "rejectionReason": null
  },
  {
    "id": 5,
    "name": "White Canvas PT Shoes (Velcro)",
    "subtitle": "Lightweight canvas shoes for sports",
    "price": 499,
    "originalPrice": 699,
    "rating": 4.5,
    "reviews": 150,
    "image": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&auto=format&fit=crop&q=80",
    "category": "shoes"
  },
  {
    "id": 6,
    "name": "Navy Blue Winter Sweater (V-Neck)",
    "subtitle": "Warm woolen blend for chilly mornings",
    "price": 849,
    "originalPrice": 1049,
    "rating": 4.8,
    "reviews": 280,
    "image": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=80",
    "category": "winter"
  },
  {
    "id": 7,
    "name": "School Winter Blazer (Maroon)",
    "subtitle": "Premium tailored blazer with brass buttons",
    "price": 1899,
    "originalPrice": 2499,
    "rating": 4.9,
    "reviews": 75,
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80",
    "category": "winter",
    "badge": "PREMIUM"
  },
  {
    "id": 8,
    "name": "Kids Waterproof Raincoat with Hood",
    "subtitle": "Bright yellow PVC raincoat for monsoons",
    "price": 649,
    "originalPrice": 899,
    "rating": 4.7,
    "reviews": 110,
    "image": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&auto=format&fit=crop&q=80",
    "category": "rain",
    "badge": "MONSOON READY"
  },
  {
    "id": 9,
    "name": "Unisex Sports T-Shirt (House Colors)",
    "subtitle": "Red, Blue, Green, Yellow available",
    "price": 349,
    "originalPrice": 499,
    "rating": 4.4,
    "reviews": 420,
    "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=80",
    "category": "sports"
  },
  {
    "id": 10,
    "name": "Winter Muffler & Beanie Set",
    "subtitle": "Matching warm accessories",
    "price": 399,
    "originalPrice": 599,
    "rating": 4.6,
    "reviews": 88,
    "image": "https://images.unsplash.com/photo-1579910404018-971eb05e83ea?w=500&auto=format&fit=crop&q=80",
    "category": "winter"
  },
  {
    "id": 11,
    "name": "Class 5 NCERT Textbook Bundle",
    "subtitle": "Maths, Science, English, Hindi, EVS",
    "price": 850,
    "originalPrice": 950,
    "rating": 4.9,
    "reviews": 530,
    "image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80",
    "category": "ncert",
    "badge": "COMPLETE SET"
  },
  {
    "id": 12,
    "name": "Olympiad Practice Workbooks (Set of 3)",
    "subtitle": "Maths, Science & Cyber Olympiad guides",
    "price": 540,
    "originalPrice": 650,
    "rating": 4.8,
    "reviews": 215,
    "image": "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=500&auto=format&fit=crop&q=80",
    "category": "practice_books"
  },
  {
    "id": 13,
    "name": "Kids Magic Water Coloring Book",
    "subtitle": "Reusable drawing book with water pen",
    "price": 299,
    "originalPrice": 450,
    "rating": 4.7,
    "reviews": 320,
    "image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80",
    "category": "drawing_books",
    "badge": "FUN LEARNING"
  },
  {
    "id": 14,
    "name": "A4 Sketch Book (100 Pages, 140 GSM)",
    "subtitle": "Thick paper suitable for watercolors & pencils",
    "price": 199,
    "originalPrice": 250,
    "rating": 4.9,
    "reviews": 410,
    "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
    "category": "drawing_books",
    "discountBadge": "",
    "stockQuantity": 200,
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      "Navy Blue"
    ],
    "gender": "Unisex",
    "images": [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80"
    ],
    "description": "",
    "sku": "SKU-14",
    "inStock": true
  },
  {
    "id": 15,
    "name": "Class 10 CBSE 10-Year Question Bank",
    "subtitle": "Previous year solved board papers",
    "price": 499,
    "originalPrice": 650,
    "rating": 4.8,
    "reviews": 650,
    "image": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=80",
    "category": "practice_books",
    "badge": "MUST HAVE"
  },
  {
    "id": 16,
    "name": "Cursive Handwriting Practice Set",
    "subtitle": "4 part series for primary students",
    "price": 180,
    "originalPrice": 240,
    "rating": 4.6,
    "reviews": 145,
    "image": "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=500&auto=format&fit=crop&q=80",
    "category": "practice_books",
    "discountBadge": "",
    "stockQuantity": 1,
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      "Navy Blue"
    ],
    "gender": "Unisex",
    "images": [
      "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=500&auto=format&fit=crop&q=80"
    ],
    "description": "",
    "sku": "SKU-16",
    "inStock": true
  },
  {
    "id": 17,
    "name": "Premium Gel Pens (Pack of 10)",
    "subtitle": "0.5mm tip, smear-proof blue ink",
    "price": 150,
    "originalPrice": 200,
    "rating": 4.7,
    "reviews": 890,
    "image": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&auto=format&fit=crop&q=80",
    "category": "supplies",
    "badge": "BESTSELLER",
    "inStock": false,
    "stockQuantity": 1,
    "discountBadge": "",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      "Navy Blue"
    ],
    "gender": "Unisex",
    "images": [
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&auto=format&fit=crop&q=80"
    ],
    "description": "",
    "sku": "SKU-17"
  },
  {
    "id": 18,
    "name": "Precision Geometry Compass Box",
    "subtitle": "Metallic finish with high quality instruments",
    "price": 249,
    "originalPrice": 350,
    "rating": 4.8,
    "reviews": 275,
    "image": "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=500&auto=format&fit=crop&q=80",
    "category": "supplies",
    "stockQuantity": 5,
    "inStock": true
  },
  {
    "id": 19,
    "name": "Stainless Steel Water Bottle (750ml)",
    "subtitle": "Leak-proof, BPA-free vacuum insulated",
    "price": 599,
    "originalPrice": 899,
    "rating": 4.5,
    "reviews": 310,
    "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
    "category": "accessories",
    "discountBadge": "",
    "stockQuantity": 20,
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      "Navy Blue"
    ],
    "gender": "Unisex",
    "description": "",
    "sku": "SKU-19",
    "inStock": true
  },
  {
    "id": 20,
    "name": "Ergonomic Student Backpack (24L)",
    "subtitle": "Water-resistant with laptop sleeve",
    "price": 1199,
    "originalPrice": 1599,
    "rating": 4.9,
    "reviews": 580,
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80",
    "category": "bags",
    "badge": "NEW ARRIVAL",
    "discountBadge": "",
    "stockQuantity": 25,
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      "Navy Blue"
    ],
    "gender": "Unisex",
    "description": "",
    "sku": "SKU-20",
    "inStock": true
  }
];
export const HERO_SLIDES = [
  {
    eyebrow: 'SCHOOL UNIFORMS',
    title: 'Comfortable & Durable School Dresses',
    description: 'Find perfect-fitting, premium quality uniforms for all major schools. Summer, winter, and sportswear available.',
    primaryCta: 'SHOP UNIFORMS',
    secondaryCta: 'VIEW SCHOOLS',
    badge: 'NEW ACADEMIC SESSION',
    image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=800&auto=format&fit=crop&q=80'
  },
  {
    eyebrow: 'NCERT & COURSE BOOKS',
    title: 'Complete Syllabus Books for All Classes',
    description: 'Get your entire book set in one place. NCERT textbooks, reference guides, and sample papers for board exams.',
    primaryCta: 'BUY BOOKS',
    secondaryCta: 'CLASS WISE KITS',
    badge: '100% GENUINE BOOKS',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80'
  },
  {
    eyebrow: 'PRACTICE & DRAWING',
    title: 'Workbook & Art Supplies for Kids',
    description: 'Foster creativity and learning with our exclusive range of magic coloring books, olympiad prep, and art supplies.',
    primaryCta: 'EXPLORE ART',
    secondaryCta: 'WORKBOOKS',
    badge: 'FUN LEARNING',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80'
  },
  {
    eyebrow: 'BACK TO CAMPUS',
    title: 'Complete School Specific Kits',
    description: 'Save time by buying pre-bundled school kits including uniforms, textbooks, notebooks, and essential stationery.',
    primaryCta: 'VIEW KITS',
    secondaryCta: 'ALL CATEGORIES',
    badge: 'UP TO 15% OFF KITS',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80'
  }
];

// About Us Page Data
export const ABOUT_DATA = {
  mission: 'To empower students, artists, and creators with thoughtfully designed, eco-friendly stationery that makes learning delightful and accessible to everyone.',
  stats: [
    { value: '50,000+', label: 'Happy Students & Learners' },
    { value: '1,200+', label: 'School Classrooms Supplied' },
    { value: '100%', label: 'Acid-Free Non-Toxic Paper' },
    { value: '4.9 / 5', label: 'Average Customer Rating' }
  ],
  milestones: [
    {
      year: '2021',
      title: 'The Missing Notebook Dilemma',
      description: 'Book Vardi began in a small college dorm room when our founders realized that premium study notebooks and smooth writing pens were either low-quality or ridiculously overpriced.'
    },
    {
      year: '2023',
      title: 'School Partnership Program',
      description: 'We partnered with over 150 schools across Delhi, Mumbai, and Bengaluru, supplying subsidized examination kits and back-to-school essentials directly to classrooms.'
    },
    {
      year: '2024',
      title: '100% Eco-Conscious Pledge',
      description: 'Eliminated single-use plastics across our packaging and transitioned all paper pulp to FSC-certified renewable sustainable plantations.'
    },
    {
      year: '2026',
      title: 'Empowering 50,000+ Young Creators',
      description: 'Today, Book Vardi stands as India’s fastest-growing student-centric stationery brand, celebrated for aesthetic designs, ethical pricing, and unmatched durability.'
    }
  ],
  values: [
    {
      id: 1,
      title: 'Eco-Conscious & Sustainable',
      description: 'Every notebook is crafted with 100% acid-free, non-toxic paper and biodegradable plant-based vegetable inks.',
      badge: 'Planet Friendly',
      icon: 'Leaf'
    },
    {
      id: 2,
      title: 'Student-First Affordable Pricing',
      description: 'We cut out distributors and middle-markups to deliver artist-grade supplies at prices every student can afford.',
      badge: 'Fair Prices',
      icon: 'Smile'
    },
    {
      id: 3,
      title: 'Ergonomic Precision & Quality',
      description: 'From non-slip pen grips to smooth lay-flat bindings, every product is rigorously tested for daily heavy study usage.',
      badge: 'Durable Build',
      icon: 'ShieldCheck'
    },
    {
      id: 4,
      title: 'Give-Back Community Pledge',
      description: 'For every 10 notebooks purchased, Book Vardi donates 1 complete student supply kit to underprivileged school children.',
      badge: '1-for-10 Pledge',
      icon: 'HeartHandshake'
    }
  ],
  team: [
    {
      name: 'Ritesh Yadav',
      role: 'Founder & Product Lead',
      bio: 'Stationery enthusiast obsessed with smooth ballpoint physics, tactile paper grains, and minimalist desk setups.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'Aaditya Sharma',
      role: 'Creative Design Director',
      bio: 'Illustrator and typographer behind our pastel palettes, custom planner grids, and vibrant aesthetic covers.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'Priya Mehra',
      role: 'Student Community & Sustainability Lead',
      bio: 'Former school educator championing eco-friendly packaging and student ambassador clubs across 40+ universities.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
    }
  ],
  testimonials: [
    {
      quote: "The 180 GSM bullet journal changed my medical school notes entirely. No highlighter bleed-through whatsoever, and the spiral binding is built like a tank!",
      author: "Ananya Patel",
      role: "3rd Year MBBS Student, Mumbai"
    },
    {
      quote: "As an art teacher, finding non-toxic, highly pigmented watercolor sets under ₹600 was impossible until Book Vardi. My students adore the pan sets.",
      author: "Vikram Sengupta",
      role: "High School Art Educator, Kolkata"
    },
    {
      quote: "Delivery is lightning fast and the pastel highlighters are the most aesthetic stationery items on my study desk. Highly recommend!",
      author: "Sneha Roy",
      role: "Class 12 CBSE Aspirant, Bengaluru"
    }
  ]
};

export const MOCK_USER_PROFILE = {
  name: 'Ritesh Yadav',
  email: 'ritesh.yadav@example.com',
  phone: '+91 98765 43210',
  studentId: 'SC-2026-8941',
  institution: 'Delhi Technological University',
  standard: 'Computer Science, 3rd Year',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  memberSince: 'July 2024',
  rewardPoints: 480,
  addresses: [
    {
      id: 1,
      type: 'Home (Default)',
      name: 'Ritesh Yadav',
      phone: '+91 98765 43210',
      addressLine: 'Flat 402, Royal Palms Residency, Sector 14',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122001',
      isDefault: true
    },
    {
      id: 2,
      type: 'Campus / Hostel',
      name: 'Ritesh Yadav',
      phone: '+91 98765 43210',
      addressLine: 'Boys Hostel Block-C, Room 312, DTU Campus, Shahbad Daulatpur',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110042',
      isDefault: false
    }
  ],
  orders: [
    {
      id: 'SC-9824',
      date: '28 Aug 2026',
      status: 'Delivered',
      statusColor: 'green',
      total: 587,
      itemsCount: 3,
      trackingNumber: 'BLUEDART-88392104',
      items: [
        {
          id: 1,
          name: 'Minimal Spiral Notebook',
          quantity: 2,
          price: 199,
          image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&auto=format&fit=crop&q=80'
        },
        {
          id: 3,
          name: 'Pastel Highlighters Set',
          quantity: 1,
          price: 189,
          image: '/images/pastel-highlighters.jpg'
        }
      ]
    },
    {
      id: 'SC-9418',
      date: '02 Sep 2026',
      status: 'In Transit',
      statusColor: 'amber',
      total: 449,
      itemsCount: 2,
      trackingNumber: 'DELHIVERY-49910382',
      items: [
        {
          id: 6,
          name: 'Precision Geometry Compass Set',
          quantity: 1,
          price: 249,
          image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=500&auto=format&fit=crop&q=80'
        },
        {
          id: 7,
          name: 'Vintage Sticky Notes Booklet',
          quantity: 2,
          price: 100,
          image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'SC-8920',
      date: '15 Jul 2026',
      status: 'Delivered',
      statusColor: 'green',
      total: 799,
      itemsCount: 1,
      trackingNumber: 'EKART-99210481',
      items: [
        {
          id: 5,
          name: 'Ergonomic Student Backpack 24L',
          quantity: 1,
          price: 799,
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80'
        }
      ]
    }
  ]
};

export const ORDERS = [
  {
    "id": "ORD-2026-101",
    "customerName": "Rohan Sharma",
    "customerEmail": "rohan.s@gmail.com",
    "customerPhone": "+91 98112 34567",
    "school": "Delhi Public School, R.K. Puram",
    "date": "06 Sep 2026",
    "total": 1499,
    "itemsCount": 2,
    "status": "Pending",
    "paymentMethod": "UPI / PhonePe",
    "paymentStatus": "Paid",
    "shippingAddress": "Flat 102, B-Block, Vasant Kunj, New Delhi 110070",
    "trackingNumber": "DELHIVERY-7782910",
    "items": [
      {
        "id": 2,
        "name": "KV Winter Uniform Sweater (Unisex)",
        "price": 949,
        "quantity": 1,
        "size": "L (38)",
        "color": "Navy Blue",
        "image": "https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&auto=format&fit=crop&q=80"
      },
      {
        "id": 6,
        "name": "Kids Magic Coloring & Drawing Book",
        "price": 299,
        "quantity": 1,
        "image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80"
      }
    ]
  },
  {
    "id": "ORD-2026-102",
    "customerName": "Meera Nambiar",
    "customerEmail": "meera.nambiar@yahoo.co.in",
    "customerPhone": "+91 97412 88990",
    "school": "The Mother’s International School",
    "date": "05 Sep 2026",
    "total": 1298,
    "itemsCount": 2,
    "status": "Confirmed",
    "paymentMethod": "Credit Card",
    "paymentStatus": "Paid",
    "shippingAddress": "Villa 14, Lotus Boulevard, Sector 100, Noida 201304",
    "trackingNumber": "BLUEDART-8823192",
    "items": [
      {
        "id": 7,
        "name": "Girls Pleated Skirt Uniform",
        "price": 649,
        "quantity": 2,
        "size": "M (32)",
        "color": "Grey",
        "image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80"
      }
    ]
  },
  {
    "id": "ORD-2026-103",
    "customerName": "Amanpreet Singh",
    "customerEmail": "aman.singh@gmail.com",
    "customerPhone": "+91 98723 44556",
    "school": "St. Xavier Senior Secondary",
    "date": "04 Sep 2026",
    "total": 310,
    "itemsCount": 2,
    "status": "Shipped",
    "paymentMethod": "Cash on Delivery",
    "paymentStatus": "Pending",
    "shippingAddress": "House 45, Model Town, Jalandhar, Punjab 144003",
    "trackingNumber": "EKART-9938120",
    "items": [
      {
        "id": 3,
        "name": "NCERT Mathematics Class 10",
        "price": 160,
        "quantity": 1,
        "image": "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=500&auto=format&fit=crop&q=80"
      },
      {
        "id": 4,
        "name": "NCERT Science Class 9",
        "price": 150,
        "quantity": 1,
        "image": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=80"
      }
    ]
  },
  {
    "id": "ORD-2026-104",
    "customerName": "Kavita Deshmukh",
    "customerEmail": "kavita.deshmukh@gmail.com",
    "customerPhone": "+91 99230 11223",
    "school": "Kendriya Vidyalaya No. 1",
    "date": "02 Sep 2026",
    "total": 899,
    "itemsCount": 1,
    "status": "Delivered",
    "paymentMethod": "UPI / Google Pay",
    "paymentStatus": "Paid",
    "shippingAddress": "Row House 12, Baner, Pune, Maharashtra 411045",
    "trackingNumber": "DELHIVERY-5561029",
    "items": [
      {
        "id": 2,
        "name": "KV Winter Uniform Sweater (Unisex)",
        "price": 899,
        "quantity": 1,
        "size": "XL (40)",
        "color": "Navy Blue",
        "image": "https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&auto=format&fit=crop&q=80"
      }
    ]
  },
  {
    "id": "ORD-2026-105",
    "customerName": "Anil Kumar Gupta",
    "customerEmail": "anil.gupta@rediffmail.com",
    "customerPhone": "+91 94150 99887",
    "school": "Modern School, Barakhamba",
    "date": "01 Sep 2026",
    "total": 749,
    "itemsCount": 1,
    "status": "Cancelled",
    "paymentMethod": "UPI / Paytm",
    "paymentStatus": "Refunded",
    "shippingAddress": "Flat 304, Indirapuram, Ghaziabad, UP 201014",
    "trackingNumber": "N/A",
    "items": [
      {
        "id": 5,
        "name": "Olympiad Reasoning Practice Book",
        "price": 249,
        "quantity": 3,
        "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80"
      }
    ]
  }
];
export const PROMOTIONS = [
  {
    "id": 1788952244472,
    "code": "SAVEMORE73",
    "title": "Special Student Discount",
    "discountType": "percentage",
    "discountValue": 15,
    "minOrderValue": 499,
    "maxDiscount": 250,
    "validFrom": "2026-09-09",
    "validUntil": "2026-12-31",
    "usageLimit": 500,
    "usageCount": 0,
    "status": "active",
    "scope": "specific_product",
    "specificProductId": 20,
    "specificProductName": "Ergonomic Student Backpack (24L)",
    "specificProductSku": "SKU-20",
    "specificProductImage": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
  },
  {
    "id": 1788946464338,
    "code": "SAVEMORE91",
    "title": "Special Student Discount",
    "discountType": "percentage",
    "discountValue": 15,
    "minOrderValue": 499,
    "maxDiscount": 250,
    "validFrom": "2026-09-09",
    "validUntil": "2026-12-31",
    "usageLimit": 500,
    "usageCount": 0,
    "status": "active",
    "scope": "specific_product",
    "specificProductId": 20,
    "specificProductName": "Ergonomic Student Backpack (24L)",
    "specificProductSku": "SKU-20",
    "specificProductImage": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
  },
  {
    "id": 1,
    "code": "BACK2SCHOOL25",
    "title": "Back to School Mega Discount",
    "discountType": "percentage",
    "discountValue": 25,
    "minOrderValue": 799,
    "maxDiscount": 350,
    "validFrom": "2026-09-01",
    "validUntil": "2026-10-31",
    "usageLimit": 1000,
    "usageCount": 238,
    "status": "active"
  },
  {
    "id": 2,
    "code": "UNIFORM15",
    "title": "School Uniform Special Savings",
    "discountType": "percentage",
    "discountValue": 15,
    "minOrderValue": 999,
    "maxDiscount": 250,
    "validFrom": "2026-08-15",
    "validUntil": "2026-09-30",
    "usageLimit": 500,
    "usageCount": 412,
    "status": "active"
  },
  {
    "id": 3,
    "code": "FLAT100OFF",
    "title": "Flat Rs 100 on Orders above 599",
    "discountType": "flat",
    "discountValue": 100,
    "minOrderValue": 599,
    "maxDiscount": 100,
    "validFrom": "2026-09-01",
    "validUntil": "2026-11-15",
    "usageLimit": 300,
    "usageCount": 97,
    "status": "active"
  },
  {
    "id": 4,
    "code": "FESTIVE30",
    "title": "Diwali Student Fest Offer",
    "discountType": "percentage",
    "discountValue": 30,
    "minOrderValue": 1299,
    "maxDiscount": 500,
    "validFrom": "2026-10-15",
    "validUntil": "2026-11-05",
    "usageLimit": 2000,
    "usageCount": 0,
    "status": "scheduled"
  }
];
export const SCHOOL_ORDERS = [
  {
    "id": "SCH-REQ-882",
    "schoolName": "St. Xavier High School, Gurugram",
    "contactPerson": "Fr. Matthew D’Souza (Principal)",
    "contactPhone": "+91 98765 11223",
    "contactEmail": "admin@stxaviersgurugram.edu.in",
    "requirementSummary": "500 Sets Class 8-10 Boys & Girls Formal Uniforms (Blazers, Shirts, Trousers/Skirts)",
    "quantity": 500,
    "estimatedBudget": 450000,
    "quoteAmount": 425000,
    "deadline": "25 Sep 2026",
    "status": "Quotation Sent",
    "notes": "Requires customized embroidered school crest on blazers and tie sets."
  },
  {
    "id": "SCH-REQ-883",
    "schoolName": "Delhi Public School, Sector 45",
    "contactPerson": "Mrs. Sunita Chawla (Store Admin)",
    "contactPhone": "+91 98110 33445",
    "contactEmail": "purchases@dpssec45.ac.in",
    "requirementSummary": "1200 Sets NCERT Core Textbooks for Classes 6th to 9th with customized Book Covers",
    "quantity": 1200,
    "estimatedBudget": 620000,
    "quoteAmount": 580000,
    "deadline": "18 Sep 2026",
    "status": "Negotiation",
    "notes": "Requested staggered delivery across 3 phases starting next Monday."
  },
  {
    "id": "SCH-REQ-884",
    "schoolName": "Army Public School, Dhaula Kuan",
    "contactPerson": "Col. R.K. Nair (Administrator)",
    "contactPhone": "+91 94190 22334",
    "contactEmail": "admin@apsdk.edu.in",
    "requirementSummary": "350 Pairs High-Grip White PT Sports Shoes (Sizes 3 to 8)",
    "quantity": 350,
    "estimatedBudget": 280000,
    "quoteAmount": 262500,
    "deadline": "30 Sep 2026",
    "status": "Accepted",
    "notes": "Advance 50% payment PO released. Expected dispatch in 10 days."
  },
  {
    "id": "SCH-REQ-885",
    "schoolName": "The Heritage School, Rohini",
    "contactPerson": "Dr. Shalini Vashisht",
    "contactPhone": "+91 99100 88776",
    "contactEmail": "principal@heritageschool.org",
    "requirementSummary": "800 Annual Art & Craft Drawing Kits with watercolor cakes and sketch pens",
    "quantity": 800,
    "estimatedBudget": 320000,
    "quoteAmount": 295000,
    "deadline": "10 Oct 2026",
    "status": "Requirement Received",
    "notes": "Looking for non-toxic certified products only."
  }
];
export const CUSTOMERS = [
  {
    "id": "CUST-001",
    "name": "Priya Sundaram",
    "email": "priya.sundaram@gmail.com",
    "phone": "+91 99887 76655",
    "schoolAffiliation": "The Mother’s International School",
    "studentName": "Aarav Sundaram (Class 7)",
    "totalOrders": 6,
    "totalSpend": 8420,
    "lastOrderDate": "05 Sep 2026",
    "status": "Active"
  },
  {
    "id": "CUST-002",
    "name": "Rohan Sharma",
    "email": "rohan.s@gmail.com",
    "phone": "+91 98112 34567",
    "schoolAffiliation": "Delhi Public School, R.K. Puram",
    "studentName": "Diya Sharma (Class 9)",
    "totalOrders": 4,
    "totalSpend": 5120,
    "lastOrderDate": "06 Sep 2026",
    "status": "Active"
  },
  {
    "id": "CUST-003",
    "name": "Amanpreet Singh",
    "email": "aman.singh@gmail.com",
    "phone": "+91 98723 44556",
    "schoolAffiliation": "St. Xavier Senior Secondary",
    "studentName": "Gurkirat Singh (Class 10)",
    "totalOrders": 3,
    "totalSpend": 3490,
    "lastOrderDate": "04 Sep 2026",
    "status": "Active"
  },
  {
    "id": "CUST-004",
    "name": "Kavita Deshmukh",
    "email": "kavita.deshmukh@gmail.com",
    "phone": "+91 99230 11223",
    "schoolAffiliation": "Kendriya Vidyalaya No. 1",
    "studentName": "Omkar Deshmukh (Class 5)",
    "totalOrders": 7,
    "totalSpend": 9280,
    "lastOrderDate": "02 Sep 2026",
    "status": "VIP"
  }
];
export const FINANCE_DATA = {
  totalRevenue: 348500,
  netProfit: 98200,
  pendingPayout: 24500,
  availableBalance: 48900,
  lastPayout: {
    date: '31 Aug 2026',
    amount: 48200,
    status: 'Credited',
    reference: 'NEFT-HDFC-9921034'
  },
  bankAccount: {
    bankName: 'HDFC Bank Ltd',
    accountHolder: 'Book Vardi Seller Hub',
    accountEnding: '9182',
    ifsc: 'HDFC0001245',
    branch: 'Cyber City, Gurugram'
  },
  recentTransactions: [
    { id: 'TXN-9081', date: '06 Sep 2026', description: 'Order Payout #ORD-2026-101', type: 'Credit', amount: 1395, status: 'Settled' },
    { id: 'TXN-9080', date: '05 Sep 2026', description: 'Order Payout #ORD-2026-102', type: 'Credit', amount: 1205, status: 'Settled' },
    { id: 'TXN-9079', date: '03 Sep 2026', description: 'Weekly Marketplace Commission Fee (8%)', type: 'Debit', amount: -2840, status: 'Deducted' },
    { id: 'TXN-9078', date: '31 Aug 2026', description: 'Automated Bank Settlement to HDFC **9182', type: 'Payout', amount: -48200, status: 'Processed' }
  ]
};

export const REVIEWS = [
  {
    "id": 1,
    "productId": 2,
    "productName": "KV Winter Uniform Sweater (Unisex)",
    "customerName": "Sunita Verma",
    "rating": 5,
    "date": "03 Sep 2026",
    "comment": "Superb quality wool! Kept my child warm all through winter, stitches are durable and color did not bleed after 3 washes.",
    "reply": "Thank you Sunita! Glad to provide authentic KV winter wear."
  },
  {
    "id": 2,
    "productId": 7,
    "productName": "Girls Pleated Skirt Uniform",
    "customerName": "Meera Nambiar",
    "rating": 4,
    "date": "02 Sep 2026",
    "comment": "Fabric is crisp and iron-free as described. Waistband elastic is comfortable for full school days.",
    "reply": "Thanks Meera! We take pride in student daily comfort."
  },
  {
    "id": 3,
    "productId": 3,
    "productName": "NCERT Mathematics Class 10",
    "customerName": "Rajesh Khanna",
    "rating": 5,
    "date": "28 Aug 2026",
    "comment": "Brand new 2026 revised print edition. Fast delivery within 24 hours in Delhi NCR.",
    "reply": ""
  }
];
export const SHIPPING_PARTNERS = [
  { id: 'delhivery', name: 'Delhivery Surface & Express', active: true, avgDays: '2-3 Days', rate: '₹45 / 500g', trackingUrl: 'https://www.delhivery.com/track/package/' },
  { id: 'bluedart', name: 'BlueDart Air Premium', active: true, avgDays: '1-2 Days', rate: '₹75 / 500g', trackingUrl: 'https://www.bluedart.com/tracking' },
  { id: 'ekart', name: 'Ekart Logistics', active: true, avgDays: '2-4 Days', rate: '₹40 / 500g', trackingUrl: 'https://ekartlogistics.com' },
  { id: 'dtdc', name: 'DTDC Courier', active: false, avgDays: '3-5 Days', rate: '₹42 / 500g', trackingUrl: 'https://www.dtdc.in/tracking' }
];

export const NOTIFICATIONS = [
  {
    "id": 1,
    "title": "New Bulk School Requirement",
    "message": "St. Xavier High School requested quotation for 500 uniform sets.",
    "date": "10 mins ago",
    "unread": true,
    "type": "school"
  },
  {
    "id": 2,
    "title": "Low Stock Alert",
    "message": "Girls Pleated Skirt Uniform (Size M) is running below reorder threshold (8 units left).",
    "date": "2 hours ago",
    "unread": true,
    "type": "inventory"
  },
  {
    "id": 3,
    "title": "Payout Credited",
    "message": "₹48,200 has been transferred to your HDFC bank account.",
    "date": "1 day ago",
    "unread": false,
    "type": "finance"
  },
  {
    "id": 4,
    "title": "New 5-Star Product Review",
    "message": "Sunita Verma left a 5-star review on KV Winter Sweater.",
    "date": "2 days ago",
    "unread": false,
    "type": "review"
  }
];
export const SELLER_SETTINGS = {
  "storeName": "Book Vardi Authorized Seller Hub",
  "storeTagline": "Verified School Uniforms, Books & Student Accessories",
  "sellerLegalName": "Vardi Book Retailers Private Limited",
  "gstin": "07AAAAA0000A1Z5",
  "pan": "ABCDE1234F",
  "email": "seller.support@bookvardi.in",
  "phone": "+91 98765 00000",
  "warehouseAddress": "Plot 42, Sector 18, Udyog Vihar Industrial Area, Gurugram, Haryana 122015",
  "pickupContact": "Dinesh Yadav (Logistics Head) • +91 98765 43210",
  "autoAcceptOrders": true,
  "emailNotifications": true,
  "smsNotifications": true
};

export const USERS = [
  {
    id: "USR-001",
    name: "Ritesh Yadav",
    email: "ritesh.yadav@example.com",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    role: "Student",
    roles: ["Student", "Customer"],
    institution: "Delhi Technological University (DTU)",
    studentId: "DTU-2026-CS104",
    isAdmin: false,
    adminStatus: "none",
    adminRole: null,
    isSeller: false,
    sellerStatus: "none",
    sellerRole: null,
    memberSince: "August 2024",
    password: "UserPassword123"
  },
  {
    id: "USR-002",
    name: "Aaditya Yadav",
    email: "admin@bookvardi.in",
    phone: "+91 98100 11223",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    role: "Super Admin",
    roles: ["Super Admin", "Partner Merchant"],
    institution: "Book Vardi Platform HQ",
    studentId: "BV-HQ-001",
    isAdmin: true,
    adminStatus: "approved",
    adminRole: "Super Admin",
    isSeller: true,
    sellerStatus: "approved",
    sellerRole: "Partner Merchant",
    memberSince: "January 2023",
    password: "AdminPassword123"
  },
  {
    id: "USR-003",
    name: "Vikram Malhotra",
    email: "seller@bookvardi.in",
    phone: "+91 97110 55432",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    role: "Partner Merchant",
    roles: ["Partner Merchant"],
    institution: "Vardi Uniforms Pvt Ltd",
    studentId: "SEL-101",
    isAdmin: false,
    adminStatus: "none",
    adminRole: null,
    isSeller: true,
    sellerStatus: "approved",
    sellerRole: "Partner Merchant",
    memberSince: "March 2024",
    password: "SellerPassword123"
  },
  {
    id: "USR-004",
    name: "Neha Gupta",
    email: "neha.admin@bookvardi.in",
    phone: "+91 98220 33445",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    role: "Operations Manager",
    roles: ["Operations Manager"],
    institution: "Book Vardi Platform HQ",
    studentId: "BV-OPS-002",
    isAdmin: true,
    adminStatus: "approved",
    adminRole: "Operations Manager",
    isSeller: false,
    sellerStatus: "none",
    sellerRole: null,
    memberSince: "July 2024",
    password: "AdminPassword123"
  },
  {
    id: "USR-005",
    name: "Priya Sundaram",
    email: "priya.sundaram@gmail.com",
    phone: "+91 99887 76655",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    role: "Parent",
    roles: ["Parent", "Customer"],
    institution: "The Mother's International School",
    studentId: "PAR-409",
    isAdmin: false,
    adminStatus: "none",
    adminRole: null,
    isSeller: false,
    sellerStatus: "none",
    sellerRole: null,
    memberSince: "January 2025",
    password: "UserPassword123"
  },
  {
    id: "USR-006",
    name: "Amanpreet Singh",
    email: "aman.singh@gmail.com",
    phone: "+91 98723 44556",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    role: "Parent",
    roles: ["Parent", "Applicant"],
    institution: "St. Xavier Senior Secondary",
    studentId: "APP-801",
    isAdmin: false,
    adminStatus: "none",
    adminRole: null,
    isSeller: false,
    sellerStatus: "pending",
    sellerRole: null,
    memberSince: "March 2025",
    password: "UserPassword123"
  },
  {
    id: "USR-007",
    name: "Dinesh Yadav",
    email: "store.manager@bookvardi.in",
    phone: "+91 98765 43211",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
    role: "Store Manager",
    roles: ["Store Manager"],
    institution: "Academic Publishers Hub",
    studentId: "SEL-102",
    isAdmin: false,
    adminStatus: "none",
    adminRole: null,
    isSeller: true,
    sellerStatus: "approved",
    sellerRole: "Store Manager",
    memberSince: "February 2024",
    password: "SellerPassword123"
  }
];

export const SELLERS = [
  {
    "id": "SEL-282",
    "name": "Priya Sundaram",
    "businessName": "New Store",
    "storeName": "New's Vardi Store",
    "email": "priya.sundaram@gmail.com",
    "phone": "+91 99887 76655",
    "status": "Pending",
    "rating": 5,
    "totalOrders": 0,
    "revenue": 0,
    "commissionRate": 8,
    "payoutBalance": 0,
    "category": "Uniforms & Stationery",
    "address": ", ",
    "joinedDate": "Today",
    "onboardingStep": 1,
    "rawApplication": {
      "sellerName": "Ritesh Yadav",
      "sellerEmail": "ritesh.seller@bookvardi.in",
      "sellerPhone": "+91 98765 43210",
      "profilePhoto": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      "emailOtpVerified": true,
      "phoneOtpVerified": true,
      "legalBusinessName": "Vardi Education Retail Pvt Ltd",
      "tradeName": "Book Vardi Student Emporium",
      "businessType": "Private Limited",
      "yearStarted": "2021",
      "annualTurnoverEstimate": "₹25L - ₹50L",
      "ownerFullName": "Ritesh Yadav",
      "ownerDesignation": "Director / Managing Partner",
      "ownerPan": "ABCDE1234F",
      "ownerAadhaarLast4": "8942",
      "kycVerified": true,
      "businessPan": "ABCDE1234F",
      "gstin": "07AAAAA0000A1Z5",
      "hasGstExemption": false,
      "msmeRegistrationNumber": "UDYAM-DL-03-0029142",
      "cinNumber": "U74999DL2021PTC384192",
      "addressLine1": "Plot 42, Okhla Industrial Area, Phase-III",
      "addressLine2": "Near Crown Plaza Metro",
      "city": "New Delhi",
      "state": "Delhi",
      "pincode": "110020",
      "country": "India",
      "addressProofType": "Electricity Bill",
      "addressProofDocNumber": "EB-2026-98124",
      "addressProofFileName": "electricity_bill_okhla_feb2026.pdf",
      "bankAccountHolder": "Vardi Education Retail Pvt Ltd",
      "bankAccountNumber": "50200084920194",
      "bankIfscCode": "HDFC0000240",
      "bankName": "HDFC Bank Ltd",
      "bankBranch": "Okhla Phase-III, New Delhi",
      "accountType": "Current Account",
      "storeName": "Book Vardi Official Hub",
      "storeSlug": "book-vardi-official",
      "storeTagline": "Certified School Uniforms, Textbooks & STEM Academic Kits",
      "storeDescription": "Premier provider of school textbooks, uniform sets, drawing guides and geometry supplies with fast 24-48 hour campus delivery.",
      "storeLogo": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80",
      "selectedCategories": [
        "Uniforms & Schoolwear",
        "NCERT & CBSE Textbooks",
        "Notebooks & Paper Crafts",
        "Writing Instruments"
      ],
      "primaryBrands": [
        "Classmate",
        "Doms",
        "Camlin",
        "Oxford",
        "Reynolds"
      ],
      "estimatedSkuCount": "250+ SKUs",
      "sampleProductTitle": "Class 10 CBSE Complete Science & Math Bundle",
      "acceptedTerms": true,
      "acceptedCommissionRate": true,
      "acceptedReturnPolicy": true,
      "authorizedSignatoryConfirmation": true,
      "applicationDate": "2026-09-09T06:57:32.864Z",
      "currentStep": 1,
      "highestStepReached": 10,
      "submissionStatus": "approved",
      "status": "Pending Approval",
      "submittedAt": "9/9/2026"
    }
  },
  {
    "id": "SEL-101",
    "storeName": "Vardi Uniforms Pvt Ltd",
    "ownerName": "Dinesh Yadav",
    "email": "dinesh@vardiuniforms.com",
    "phone": "+91 98765 12340",
    "gstin": "07AAAAA0000A1Z5",
    "pan": "ABCDE1234F",
    "city": "Gurugram, Haryana",
    "status": "Verified",
    "rating": 4.8,
    "totalProducts": 45,
    "totalSales": 845000,
    "commissionRate": 10,
    "payoutBalance": 48200,
    "bankDetails": {
      "bank": "HDFC Bank",
      "account": "•••• 9182",
      "ifsc": "HDFC0001245"
    }
  },
  {
    "id": "SEL-102",
    "storeName": "Apex School Sportswear",
    "ownerName": "Vikramjeet Rathore",
    "email": "sales@apexsportswear.in",
    "phone": "+91 98112 88441",
    "gstin": "08BBBBB1111B2Z6",
    "pan": "BCDEF2345G",
    "city": "Jaipur, Rajasthan",
    "status": "Verified",
    "rating": 4.7,
    "totalProducts": 28,
    "totalSales": 412000,
    "commissionRate": 10,
    "payoutBalance": 24500,
    "bankDetails": {
      "bank": "ICICI Bank",
      "account": "•••• 4421",
      "ifsc": "ICIC0000451"
    }
  },
  {
    "id": "SEL-103",
    "storeName": "Stride Footwear Hub",
    "ownerName": "Kunal Agarwal",
    "email": "contact@stridefootwear.com",
    "phone": "+91 99230 77112",
    "gstin": "27CCCCC2222C3Z7",
    "pan": "CDEFG3456H",
    "city": "Pune, Maharashtra",
    "status": "Verified",
    "rating": 4.6,
    "totalProducts": 18,
    "totalSales": 310500,
    "commissionRate": 12,
    "payoutBalance": 18400,
    "bankDetails": {
      "bank": "State Bank of India",
      "account": "•••• 8820",
      "ifsc": "SBIN0004120"
    }
  },
  {
    "id": "SEL-104",
    "storeName": "Vidya Book Distributors",
    "ownerName": "Manish Chaurasia",
    "email": "vidyabooks@gmail.com",
    "phone": "+91 94150 33991",
    "gstin": "09DDDDD3333D4Z8",
    "pan": "DEFGH4567I",
    "city": "Varanasi, UP",
    "status": "Verified",
    "rating": 4.9,
    "totalProducts": 64,
    "totalSales": 1240000,
    "commissionRate": 8,
    "payoutBalance": 62100,
    "bankDetails": {
      "bank": "Axis Bank",
      "account": "•••• 3319",
      "ifsc": "UTIB0001090"
    }
  },
  {
    "id": "SEL-105",
    "storeName": "Creative Kiddo Stationers",
    "ownerName": "Neha Bajaj",
    "email": "support@creativekiddo.in",
    "phone": "+91 98721 55667",
    "gstin": "03EEEEE4444E5Z9",
    "pan": "EFGHI5678J",
    "city": "Chandigarh",
    "status": "Verified",
    "rating": 4.8,
    "totalProducts": 32,
    "totalSales": 289000,
    "commissionRate": 18,
    "payoutBalance": 15200,
    "bankDetails": {
      "bank": "Punjab National Bank",
      "account": "•••• 6541",
      "ifsc": "PUNB0124000"
    }
  },
  {
    "id": "SEL-106",
    "storeName": "Delhi Uniform Crafters",
    "ownerName": "Praveen Solanki",
    "email": "praveen@delhiuniforms.com",
    "phone": "+91 99100 44321",
    "gstin": "07FFFFF5555F6Z0",
    "pan": "FGHIJ6789K",
    "city": "New Delhi",
    "status": "Verified",
    "rating": 0,
    "totalProducts": 5,
    "totalSales": 0,
    "commissionRate": 12,
    "payoutBalance": 0,
    "bankDetails": {
      "bank": "Kotak Mahindra Bank",
      "account": "•••• 7701",
      "ifsc": "KKBK0000214"
    },
    "rejectionReason": null
  }
];