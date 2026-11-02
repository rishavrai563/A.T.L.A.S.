using Microsoft.AspNetCore.Mvc;
using AlgoTrading.Models;
using AlgoTrading.Services;

namespace AlgoTrading.Controllers;

/// <summary>
/// Account and session endpoints.
///
///   POST /api/auth/register      — Create account, returns user + token
///   POST /api/auth/login         — Sign in, returns user + token
///   POST /api/auth/logout        — Revoke the current token
///   GET  /api/auth/me            — Current user with portfolio
///   PUT  /api/auth/me            — Update display name
///   POST /api/auth/me/password   — Change password (signs out other sessions)
///
/// Authenticated endpoints expect <c>Authorization: Bearer &lt;token&gt;</c>.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const int MinPasswordLength = 6;

    private readonly UserStore _users;
    private readonly CurrentUser _current;

    public AuthController(UserStore users, CurrentUser current)
    {
        _users = users;
        _current = current;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Name, email, and password are required." });

        if (!UserStore.IsValidEmail(UserStore.NormalizeEmail(req.Email)))
            return BadRequest(new { error = "Please enter a valid email address." });

        if (req.Password.Length < MinPasswordLength)
            return BadRequest(new { error = $"Password must be at least {MinPasswordLength} characters." });

        var user = await _users.RegisterAsync(req.Name, req.Email, req.Password);
        if (user == null)
            return Conflict(new { error = "An account with this email already exists." });

        var token = await _users.CreateSessionAsync(user.Id);
        return Ok(ToResponse(user, token));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required." });

        var user = await _users.LoginAsync(req.Email, req.Password);
        if (user == null)
            return Unauthorized(new { error = "Invalid email or password." });

        var token = await _users.CreateSessionAsync(user.Id);
        return Ok(ToResponse(user, token));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (_current.Token is { } token) await _users.RevokeSessionAsync(token);
        return Ok(new { signedOut = true });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _current.GetAsync();
        if (user == null) return Unauthorized(new { error = "Session expired. Please sign in again." });
        return Ok(ToResponse(user, _current.Token!));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req)
    {
        var user = await _current.GetAsync();
        if (user == null) return Unauthorized(new { error = "Session expired. Please sign in again." });
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Name is required." });

        await _users.UpdateNameAsync(user, req.Name);
        return Ok(ToResponse(user, _current.Token!));
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var user = await _current.GetAsync();
        if (user == null) return Unauthorized(new { error = "Session expired. Please sign in again." });
        if (req.NewPassword.Length < MinPasswordLength)
            return BadRequest(new { error = $"Password must be at least {MinPasswordLength} characters." });

        if (!await _users.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword, _current.Token!))
            return BadRequest(new { error = "Current password is incorrect." });

        return Ok(new { changed = true });
    }

    private static object ToResponse(User user, string token) => new
    {
        token,
        id = user.Id,
        name = user.Name,
        email = user.Email,
        clientId = user.ClientId,
        memberSince = user.MemberSince,
        cash = user.Cash,
        holdings = user.Holdings,
        orders = user.Orders,
    };
}
