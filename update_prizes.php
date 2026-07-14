

use App\Models\Prize;

$p = Prize::all();
if ($p->count() > 0) {
    if(isset($p[0])) $p[0]->update(['name' => 'iPhone 15']);
    if(isset($p[1])) $p[1]->update(['name' => 'Mac Book']);
    if(isset($p[2])) $p[2]->update(['name' => 'iPad']);
    if(isset($p[3])) $p[3]->update(['name' => 'Uang Tunai 1 Juta']);
} else {
    Prize::create(['name' => 'iPhone 15', 'stock' => 10]);
    Prize::create(['name' => 'Mac Book', 'stock' => 5]);
    Prize::create(['name' => 'iPad', 'stock' => 10]);
    Prize::create(['name' => 'Uang Tunai 1 Juta', 'stock' => 20]);
}

echo "Prizes updated successfully\n";
