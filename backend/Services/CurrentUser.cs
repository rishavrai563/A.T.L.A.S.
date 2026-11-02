using AlgoTrading.Models;

namespace AlgoTrading.Services;

/// <summary>
/// Resolves the signed-in user from the request's
/// <c>Authorization: Bearer &lt;token&gt;</c> header. Scoped per request.
/// </summary>
public class CurrentUser
{
    private readonly IHttpContextAccessor _http;
    private readonly UserStore _users;
    private User? _user;
    private bool _resolved;

    public CurrentUser(IHttpContextAccessor http, UserStore users)
    {
        _http = http;
        _users = users;
    }

    public string? Token
    {
        get
        {
            var header = _http.HttpContext?.Request.Headers.Authorization.ToString();
            return header != null && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? header["Bearer ".Length..].Trim()
                : null;
        }
    }

    /// <summary>The authenticated user, or null when the token is missing or expired.</summary>
    public async Task<User?> GetAsync()
    {
        if (_resolved) return _user;
        _resolved = true;
        var token = Token;
        _user = string.IsNullOrEmpty(token) ? null : await _users.GetBySessionTokenAsync(token);
        return _user;
    }
}
