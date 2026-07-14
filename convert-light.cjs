const fs = require('fs');
const files = [
  'resources/js/pages/SpinwheelPage.jsx',
  'resources/js/pages/LiveSpinPage.jsx'
];

const replacements = {
  'bg-gray-900': 'bg-gray-50',
  'bg-stone-900': 'bg-stone-50',
  'bg-gray-800': 'bg-white',
  'bg-gray-950': 'bg-gray-100',
  'bg-gray-700': 'bg-gray-200',
  'text-gray-100': 'text-gray-900',
  'text-gray-200': 'text-gray-800',
  'text-gray-300': 'text-gray-700',
  'text-gray-400': 'text-gray-600',
  'text-gray-500': 'text-gray-500',
  'border-gray-800': 'border-gray-200',
  'border-gray-700': 'border-gray-300',
  'border-gray-600': 'border-gray-400',
  'shadow-inner': 'shadow-sm'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace theme background colors carefully
    // Since we want standard light mode Tailwind classes.
    const keys = Object.keys(replacements);
    
    keys.forEach(key => {
      const val = replacements[key];
      const regex = new RegExp(key, 'g');
      content = content.replace(regex, val);
    });
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
