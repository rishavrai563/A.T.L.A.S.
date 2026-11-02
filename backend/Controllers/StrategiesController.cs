using Microsoft.AspNetCore.Mvc;
using AlgoTrading.Models;
using AlgoTrading.Services;

namespace AlgoTrading.Controllers;

/// <summary>
/// CRUD controller for the signed-in user's strategy profiles and backtest
/// history. Every endpoint requires <c>Authorization: Bearer &lt;token&gt;</c>.
///
/// Endpoints:
///   GET    /api/strategies              — List the user's strategies
///   GET    /api/strategies/{id}         — Get single strategy
///   POST   /api/strategies              — Create new blank strategy
///   PUT    /api/strategies/{id}         — Save/update a strategy
///   DELETE /api/strategies/{id}         — Delete a strategy
///   GET    /api/strategies/history      — All of the user's backtest records
///   GET    /api/strategies/{id}/history — Backtest records for one strategy
///   POST   /api/strategies/{id}/history — Record a completed backtest
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class StrategiesController : ControllerBase
{
    private readonly StrategyStore _store;
    private readonly CurrentUser _current;
    private readonly ILogger<StrategiesController> _logger;

    public StrategiesController(StrategyStore store, CurrentUser current, ILogger<StrategiesController> logger)
    {
        _store = store;
        _current = current;
        _logger = logger;
    }

    private static UnauthorizedObjectResult SignInRequired() =>
        new(new { error = "Session expired. Please sign in again." });

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        return Ok(await _store.GetAllStrategiesAsync(user.Id));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetOne(string id)
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        var s = await _store.GetStrategyAsync(user.Id, id);
        if (s == null) return NotFound();
        return Ok(s);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] StrategyProfile profile)
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        var created = await _store.CreateStrategyAsync(user.Id, profile);
        _logger.LogInformation("Created strategy: {Name} ({Id})", created.Name, created.Id);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] StrategyProfile profile)
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        var updated = await _store.UpdateStrategyAsync(user.Id, id, profile);
        if (updated == null) return NotFound();
        _logger.LogInformation("Updated strategy: {Name} ({Id})", updated.Name, updated.Id);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        if (!await _store.DeleteStrategyAsync(user.Id, id)) return NotFound();
        _logger.LogInformation("Deleted strategy: {Id}", id);
        return Ok(new { deleted = true });
    }

    // ── Backtest History ───────────────────────────────────

    [HttpGet("history")]
    public async Task<ActionResult> GetAllHistory()
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        return Ok(await _store.GetBacktestHistoryAsync(user.Id));
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult> GetStrategyHistory(string id)
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        return Ok(await _store.GetHistoryForStrategyAsync(user.Id, id));
    }

    [HttpPost("{id}/history")]
    public async Task<ActionResult> RecordBacktest(string id, [FromBody] BacktestRecord record)
    {
        if (await _current.GetAsync() is not { } user) return SignInRequired();
        record.StrategyId = id;
        var saved = await _store.AddBacktestRecordAsync(user.Id, record);
        if (saved == null) return NotFound();
        _logger.LogInformation("Recorded backtest for strategy {Id}: {Return}%", id, saved.TotalReturn);
        return Ok(saved);
    }
}
