const fs = require('fs');
const files = [
  'resources/js/pages/SpinwheelPage.jsx',
  'resources/js/pages/LiveSpinPage.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace old dark mode table divides
    content = content.replace(/divide-gray-700/g, 'divide-gray-200');
    content = content.replace(/divide-gray-800/g, 'divide-gray-200');
    
    // Replace old dark mode table headers
    content = content.replace(/bg-gray-50 text-gray-600/g, 'bg-gray-200/50 text-gray-700');
    content = content.replace(/bg-white text-gray-600/g, 'bg-gray-100 text-gray-700');

    // Replace dark mode soft buttons (badges/actions)
    content = content.replace(/bg-rose-900\/40/g, 'bg-rose-50');
    content = content.replace(/text-rose-400/g, 'text-rose-600');
    content = content.replace(/hover:text-rose-300/g, 'hover:text-rose-700');
    content = content.replace(/border-rose-800/g, 'border-rose-200');

    content = content.replace(/bg-emerald-900\/40/g, 'bg-emerald-50');
    content = content.replace(/text-emerald-400/g, 'text-emerald-600');
    content = content.replace(/border-emerald-800/g, 'border-emerald-200');

    content = content.replace(/bg-amber-900\/40/g, 'bg-amber-50');
    content = content.replace(/text-amber-400/g, 'text-amber-700');
    content = content.replace(/hover:text-amber-300/g, 'hover:text-amber-800');
    content = content.replace(/border-amber-800/g, 'border-amber-200');

    content = content.replace(/bg-indigo-900\/40/g, 'bg-indigo-50');
    // text-indigo-400 is also used for headers, so we only replace it where it's part of a button or badge?
    // Actually, SpinwheelPro logo uses text-indigo-400. That's fine. Wait, let's keep logo text-indigo-400 or make it 600? 600 is better for light mode anyway.
    content = content.replace(/text-indigo-400/g, 'text-indigo-600');
    content = content.replace(/hover:text-indigo-300/g, 'hover:text-indigo-700');
    content = content.replace(/border-indigo-800/g, 'border-indigo-200');

    content = content.replace(/bg-indigo-600\/20/g, 'bg-indigo-50');
    content = content.replace(/border-indigo-500\/50/g, 'border-indigo-200');
    content = content.replace(/bg-indigo-600 text-white/g, 'bg-indigo-100 text-indigo-700 shadow-sm');
    
    // Fix text-gray-400 used as accents in light mode headers
    content = content.replace(/text-gray-400/g, 'text-gray-600');

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
