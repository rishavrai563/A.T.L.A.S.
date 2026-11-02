using System.Text.Json.Serialization;

namespace AlgoTrading.Models;

/// <summary>
/// Registered user, persisted in the ATLAS database. Portfolio holdings and
/// orders are owned rows keyed by the user's ID.
/// </summary>
public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string Name { get; set; } = "";
    /// <summary>Stored lower-cased; unique.</summary>
    public string Email { get; set; } = "";
    /// <summary>PBKDF2 hash string, see <c>PasswordHasher</c>. Never serialized.</summary>
    [JsonIgnore] public string PasswordHash { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string MemberSince { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Portfolio
    public double Cash { get; set; } = 42380.50;
    public List<Holding> Holdings { get; set; } = new();
    public List<UserOrder> Orders { get; set; } = new();
}

public class Holding
{
    [JsonIgnore] public string UserId { get; set; } = "";
    public string Symbol { get; set; } = "";
    public string Name { get; set; } = "";
    public int Qty { get; set; }
    public double Avg { get; set; }
    public double Ltp { get; set; }
    public double PrevClose { get; set; }
}

public class UserOrder
{
    [JsonIgnore] public string UserId { get; set; } = "";
    public string Id { get; set; } = "";
    public string Symbol { get; set; } = "";
    public string Side { get; set; } = "BUY";
    public int Qty { get; set; }
    public double Price { get; set; }
    public string Type { get; set; } = "Market";
    public string Status { get; set; } = "Executed";
    public string Time { get; set; } = "";
    public string Strategy { get; set; } = "";
}

/// <summary>
/// A login session. Only the SHA-256 hash of the bearer token is stored, so a
/// leaked database cannot be used to impersonate users.
/// </summary>
public class UserSession
{
    public string TokenHash { get; set; } = "";
    public string UserId { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
}

public class RegisterRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class UpdateProfileRequest
{
    public string Name { get; set; } = "";
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}
