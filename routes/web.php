<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ApiController;

use App\Http\Controllers\AuthController;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Public Content Spin Routes
Route::get('/content/session/{uuid}', [ApiController::class, 'contentSpinPage']);
Route::get('/api/content-spin/sequence/{uuid}', [ApiController::class, 'getContentSequence']);
Route::post('/api/content-spin/sequence/{uuid}/execute', [ApiController::class, 'executeContentSequence']);
Route::post('/api/content-spin/sequence/{uuid}/add-random', [ApiController::class, 'addRandomContentSequence']);

// Public Live Spin Routes
Route::get('/live/{platform}/{slug}', [ApiController::class, 'liveSpinPage'])->where('platform', 'tiktok|shopee|mix');
Route::get('/api/live/{platform}/{slug}/events', [ApiController::class, 'getLiveEventDetails'])->where('platform', 'tiktok|shopee|mix');
Route::post('/api/live/{platform}/{slug}/spin', [ApiController::class, 'executeLiveEvent'])->where('platform', 'tiktok|shopee|mix');
Route::get('/api/prizes', [ApiController::class, 'prizes']);

Route::middleware(['auth'])->group(function () {
    Route::get('/', function () {
        return Inertia::render('SpinwheelPage');
    });

    Route::post('/spin', [ApiController::class, 'spin']);
    Route::get('/stats', [ApiController::class, 'stats']);
    Route::get('/histories', [ApiController::class, 'histories']);
    Route::post('/histories', [ApiController::class, 'createHistory']);
    Route::put('/histories/{id}', [ApiController::class, 'updateHistory']);
    Route::delete('/histories/{id}', [ApiController::class, 'deleteHistory']);
    Route::post('/content-spin/sequence', [ApiController::class, 'createContentSequence']);
    Route::get('/participants/search', [ApiController::class, 'searchParticipants']);
    Route::get('/prizes', [ApiController::class, 'prizes']);
    Route::post('/prizes', [ApiController::class, 'addPrize']);
    Route::put('/prizes/{id}', [ApiController::class, 'updatePrize']);
    Route::delete('/prizes/{id}', [ApiController::class, 'deletePrize']);
    Route::get('/replay/{id}', [ApiController::class, 'replayPage']);

    // Event management (auth required)
    Route::get('/events', [ApiController::class, 'getEvents']);
    Route::post('/events', [ApiController::class, 'createEvent']);
    Route::delete('/events/{id}', [ApiController::class, 'deleteEvent']);
    Route::get('/events/{eventId}/details', [ApiController::class, 'getEventDetails']);
    Route::post('/events/{eventId}/details/bulk', [ApiController::class, 'bulkCreateEventDetails']);
    Route::put('/event-details/{id}', [ApiController::class, 'updateEventDetail']);
    Route::delete('/event-details/{id}', [ApiController::class, 'deleteEventDetail']);

    // Upload routes for super-admin and store-admin
    Route::post('/upload', [ApiController::class, 'upload']);
    Route::post('/upload-combined', [ApiController::class, 'uploadCombined']);

    Route::get('/toko', function () {
        return Inertia::render('StoreAdminPage');
    });

    Route::get('/quick-spin', function () {
        return Inertia::render('QuickSpinPage');
    });
    Route::get('/api/quick-spin/init', [ApiController::class, 'quickSpinInit']);
    Route::post('/api/quick-spin/spin', [ApiController::class, 'quickSpin']);

    Route::middleware(['role:super-admin'])->group(function () {
        Route::get('/admin', function () {
            return Inertia::render('AdminPage');
        });
        Route::post('/settings/winner', [ApiController::class, 'setWinner']);
    });
});
