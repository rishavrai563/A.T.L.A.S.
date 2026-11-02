using AlgoTrading.Data;
using AlgoTrading.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database — SQLite file (path from ConnectionStrings:Atlas in appsettings.json)
// A relative path is anchored to the project folder, not the launch directory.
var sqlite = new SqliteConnectionStringBuilder(builder.Configuration.GetConnectionString("Atlas") ?? "Data Source=Data/atlas.db");
if (!Path.IsPathRooted(sqlite.DataSource))
    sqlite.DataSource = Path.Combine(builder.Environment.ContentRootPath, sqlite.DataSource);
Directory.CreateDirectory(Path.GetDirectoryName(sqlite.DataSource)!);
builder.Services.AddDbContext<AtlasDbContext>(options => options.UseSqlite(sqlite.ToString()));

// Register services
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<AssetRegistry>();
builder.Services.AddSingleton<LeanRunner>();
builder.Services.AddSingleton<LeanResultParser>();
builder.Services.AddSingleton<DataValidator>();
builder.Services.AddSingleton<JobManager>();
builder.Services.AddScoped<StrategyStore>();
builder.Services.AddScoped<UserStore>();
builder.Services.AddScoped<CurrentUser>();
builder.Services.AddHttpClient<YahooHistoricalDataProvider>();
builder.Services.AddSingleton<IHistoricalDataProvider, YahooHistoricalDataProvider>();
builder.Services.AddSingleton<HistoricalDataService>();
builder.Services.AddScoped<BacktestService>();

// CORS — allow the Vite dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Create the database schema on first run and seed the demo account.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AtlasDbContext>();
    db.Database.EnsureCreated();
    await scope.ServiceProvider.GetRequiredService<UserStore>().EnsureDemoUserAsync();
}

app.UseCors();
app.MapControllers();

app.Run();
