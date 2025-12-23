<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded within a "api" middleware group. Enjoy building your API!
|
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Article CRUD API Routes
Route::apiResource('articles', ArticleController::class);

// Additional Article Endpoints
Route::get('/articles-latest', [ArticleController::class, 'latest']);
Route::get('/articles/{id}/competitors', [ArticleController::class, 'competitors']);
Route::post('/scrape', [ArticleController::class, 'scrape']);
