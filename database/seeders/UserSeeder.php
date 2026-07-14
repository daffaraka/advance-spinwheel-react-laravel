<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $superAdmin = Role::create(['name' => 'super-admin']);
        $admin = Role::create(['name' => 'admin']);
        $staff = Role::create(['name' => 'staff']);

        // Create Super Admin
        $user1 = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@spin.com',
            'password' => Hash::make('password'),
        ]);
        $user1->assignRole($superAdmin);

        // Create Admin (Toko)
        $user2 = User::create([
            'name' => 'Admin Toko',
            'email' => 'admin@spin.com',
            'password' => Hash::make('password'),
        ]);
        $user2->assignRole($admin);

        // Create Staff
        $user3 = User::create([
            'name' => 'Staff',
            'email' => 'staff@spin.com',
            'password' => Hash::make('password'),
        ]);
        $user3->assignRole($staff);
    }
}
