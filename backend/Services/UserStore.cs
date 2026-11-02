using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using AlgoTrading.Data;
using AlgoTrading.Models;
using Microsoft.EntityFrameworkCore;

namespace AlgoTrading.Services;

/// <summary>
/// Database-backed user accounts: registration, login, bearer-token sessions
/// and profile updates. Scoped per request.
/// </summary>
public class UserStore
{
    public static readonly TimeSpan SessionLifetime = TimeSpan.FromDays(7);

    private readonly AtlasDbContext _db;
    private readonly StrategyStore _strategies;

    public UserStore(AtlasDbContext db, StrategyStore strategies)
    {
        _db = db;
        _strategies = strategies;
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public static bool IsValidEmail(string email) =>
        MailAddress.TryCreate(email, out var parsed) && parsed.Address == email && email.Contains('.');

    // ── Accounts ───────────────────────────────────────────

    /// <summary>Creates an account with a starter portfolio and strategies. Null if the email is taken.</summary>
    public async Task<User?> RegisterAsync(string name, string email, string password)
    {
        email = NormalizeEmail(email);
        if (await _db.Users.AnyAsync(u => u.Email == email)) return null;

        var now = DateTime.UtcNow;
        var count = await _db.Users.CountAsync();
        var user = new User
        {
            Name = name.Trim(),
            Email = email,
            PasswordHash = PasswordHasher.Hash(password),
            ClientId = $"ATL-{now.Year}-{count + 1:D4}",
            MemberSince = now.ToString("MMM yyyy"),
            Holdings = GetDefaultHoldings(),
            Orders = GetDefaultOrders(),
        };

        _db.Users.Add(user);
        _strategies.AddStarterStrategies(user.Id);
        await _db.SaveChangesAsync();
        return user;
    }

    /// <summary>Returns the user when the credentials match, otherwise null.</summary>
    public async Task<User?> LoginAsync(string email, string password)
    {
        email = NormalizeEmail(email);
        var user = await WithPortfolio().FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !PasswordHasher.Verify(password, user.PasswordHash)) return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return user;
    }

    public Task<User?> GetByIdAsync(string id) => WithPortfolio().FirstOrDefaultAsync(u => u.Id == id);

    public async Task UpdateNameAsync(User user, string name)
    {
        user.Name = name.Trim();
        await _db.SaveChangesAsync();
    }

    /// <summary>Changes the password and signs out every other session.</summary>
    public async Task<bool> ChangePasswordAsync(User user, string currentPassword, string newPassword, string keepToken)
    {
        if (!PasswordHasher.Verify(currentPassword, user.PasswordHash)) return false;
        user.PasswordHash = PasswordHasher.Hash(newPassword);
        var keepHash = HashToken(keepToken);
        await _db.Sessions.Where(s => s.UserId == user.Id && s.TokenHash != keepHash).ExecuteDeleteAsync();
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Sessions ───────────────────────────────────────────

    /// <summary>Issues a new bearer token. Only its hash is stored.</summary>
    public async Task<string> CreateSessionAsync(string userId)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var now = DateTime.UtcNow;

        // Housekeeping: drop this user's expired sessions.
        await _db.Sessions.Where(s => s.UserId == userId && s.ExpiresAt < now).ExecuteDeleteAsync();

        _db.Sessions.Add(new UserSession
        {
            TokenHash = HashToken(token),
            UserId = userId,
            CreatedAt = now,
            ExpiresAt = now + SessionLifetime,
        });
        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<User?> GetBySessionTokenAsync(string token)
    {
        var hash = HashToken(token);
        var session = await _db.Sessions.AsNoTracking().FirstOrDefaultAsync(s => s.TokenHash == hash);
        if (session == null || session.ExpiresAt < DateTime.UtcNow) return null;
        return await GetByIdAsync(session.UserId);
    }

    public Task RevokeSessionAsync(string token)
    {
        var hash = HashToken(token);
        return _db.Sessions.Where(s => s.TokenHash == hash).ExecuteDeleteAsync();
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private IQueryable<User> WithPortfolio() =>
        _db.Users.Include(u => u.Holdings).Include(u => u.Orders);

    // ── Seed data ──────────────────────────────────────────

    /// <summary>Creates the demo account on first run.</summary>
    public async Task EnsureDemoUserAsync()
    {
        const string email = "rishav@email.com";
        if (await _db.Users.AnyAsync(u => u.Email == email)) return;

        var demo = new User
        {
            Id = "rishav01",
            Name = "Rishav Kumar",
            Email = email,
            PasswordHash = PasswordHasher.Hash("password123"),
            ClientId = "ATL-2024-1014",
            MemberSince = "Aug 2024",
            Holdings = GetDefaultHoldings(),
            Orders = GetDefaultOrders(),
        };
        _db.Users.Add(demo);
        _strategies.AddStarterStrategies(demo.Id);
        await _db.SaveChangesAsync();
    }

    public static List<Holding> GetDefaultHoldings()
    {
        return new List<Holding>
        {
            new() { Symbol = "RELIANCE", Name = "Reliance Industries", Qty = 25, Avg = 2410.0, Ltp = 2894.35, PrevClose = 2871.2 },
            new() { Symbol = "TCS", Name = "Tata Consultancy", Qty = 12, Avg = 3620.5, Ltp = 4012.8, PrevClose = 3995.0 },
            new() { Symbol = "INFY", Name = "Infosys", Qty = 30, Avg = 1580.0, Ltp = 1492.6, PrevClose = 1504.1 },
            new() { Symbol = "HDFCBANK", Name = "HDFC Bank", Qty = 40, Avg = 1520.25, Ltp = 1688.9, PrevClose = 1679.4 },
            new() { Symbol = "ITC", Name = "ITC", Qty = 150, Avg = 402.1, Ltp = 468.55, PrevClose = 466.0 },
            new() { Symbol = "TATAMOTORS", Name = "Tata Motors", Qty = 60, Avg = 935.4, Ltp = 861.25, PrevClose = 872.9 },
            new() { Symbol = "SBIN", Name = "State Bank of India", Qty = 80, Avg = 612.0, Ltp = 804.7, PrevClose = 798.3 },
            new() { Symbol = "ZOMATO", Name = "Zomato", Qty = 200, Avg = 184.5, Ltp = 241.15, PrevClose = 238.4 },
        };
    }

    public static List<UserOrder> GetDefaultOrders()
    {
        var now = DateTime.UtcNow;
        return new List<UserOrder>
        {
            new() { Id = "ORD-10492", Symbol = "SBIN", Side = "BUY", Qty = 20, Price = 804.5, Type = "Market", Status = "Executed", Time = now.AddHours(-2).ToString("o"), Strategy = "RSI Mean Reversion" },
            new() { Id = "ORD-10491", Symbol = "INFY", Side = "SELL", Qty = 10, Price = 1495.0, Type = "Limit", Status = "Pending", Time = now.AddHours(-5).ToString("o"), Strategy = "SMA Crossover 20/50" },
            new() { Id = "ORD-10488", Symbol = "ZOMATO", Side = "BUY", Qty = 50, Price = 238.9, Type = "Market", Status = "Executed", Time = now.AddHours(-26).ToString("o"), Strategy = "Momentum Breakout" },
            new() { Id = "ORD-10485", Symbol = "TATAMOTORS", Side = "SELL", Qty = 15, Price = 880.0, Type = "Limit", Status = "Cancelled", Time = now.AddHours(-30).ToString("o"), Strategy = "SMA Crossover 20/50" },
            new() { Id = "ORD-10479", Symbol = "ITC", Side = "BUY", Qty = 100, Price = 455.2, Type = "Market", Status = "Executed", Time = now.AddHours(-52).ToString("o"), Strategy = "Manual" },
            new() { Id = "ORD-10474", Symbol = "HDFCBANK", Side = "BUY", Qty = 10, Price = 1662.0, Type = "Limit", Status = "Executed", Time = now.AddHours(-76).ToString("o"), Strategy = "RSI Mean Reversion" },
            new() { Id = "ORD-10470", Symbol = "RELIANCE", Side = "BUY", Qty = 5, Price = 2850.4, Type = "Market", Status = "Rejected", Time = now.AddHours(-98).ToString("o"), Strategy = "Momentum Breakout" },
            new() { Id = "ORD-10466", Symbol = "TCS", Side = "BUY", Qty = 4, Price = 3980.0, Type = "Limit", Status = "Executed", Time = now.AddHours(-120).ToString("o"), Strategy = "Manual" },
        };
    }
}
