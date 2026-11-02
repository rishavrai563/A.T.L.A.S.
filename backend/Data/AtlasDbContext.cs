using System.Text.Json;
using AlgoTrading.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlgoTrading.Data;

/// <summary>
/// SQLite database holding users, sessions, portfolios, strategies and
/// backtest history. Collections without their own table (parameter schemas,
/// parameter values, full backtest results) are stored as JSON columns.
/// </summary>
public class AtlasDbContext : DbContext
{
    public AtlasDbContext(DbContextOptions<AtlasDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Holding> Holdings => Set<Holding>();
    public DbSet<UserOrder> Orders => Set<UserOrder>();
    public DbSet<UserSession> Sessions => Set<UserSession>();
    public DbSet<StrategyProfile> Strategies => Set<StrategyProfile>();
    public DbSet<BacktestRecord> BacktestRecords => Set<BacktestRecord>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasMany(u => u.Holdings).WithOne().HasForeignKey(h => h.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(u => u.Orders).WithOne().HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        model.Entity<Holding>().HasKey(h => new { h.UserId, h.Symbol });
        model.Entity<UserOrder>().HasKey(o => new { o.UserId, o.Id });

        model.Entity<UserSession>(e =>
        {
            e.HasKey(s => s.TokenHash);
            e.HasIndex(s => s.UserId);
            e.HasOne<User>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        model.Entity<StrategyProfile>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.OwnerId);
            e.HasOne<User>().WithMany().HasForeignKey(s => s.OwnerId).OnDelete(DeleteBehavior.Cascade);
            JsonColumn(e.Property(s => s.ParametersSchema));
            JsonColumn(e.Property(s => s.ParameterValues));
        });

        model.Entity<BacktestRecord>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.OwnerId, r.RanAt });
            e.HasOne<User>().WithMany().HasForeignKey(r => r.OwnerId).OnDelete(DeleteBehavior.Cascade);
            JsonColumn(e.Property(r => r.ParameterValues));
            JsonColumn(e.Property(r => r.FullResult));
        });
    }

    // Serializes a property to a JSON text column, with a comparer so EF
    // detects in-place changes to the collection.
    private static void JsonColumn<T>(PropertyBuilder<T> property)
    {
        property.HasConversion(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<T>(v, (JsonSerializerOptions?)null)!,
            new ValueComparer<T>(
                (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                v => v == null ? 0 : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
                v => JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null)!));
    }
}
