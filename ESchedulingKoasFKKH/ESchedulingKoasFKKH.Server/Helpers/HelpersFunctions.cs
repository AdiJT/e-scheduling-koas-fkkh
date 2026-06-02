using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Helpers;

public static class HelpersFunctions
{
    public static BadRequestObjectResult BadRequest(Dictionary<string, string> errors)
    {
        return new BadRequestObjectResult(new {
            type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
            title = "One or more validation errors occurred.",
            status = 400,
            errors
        });
    }

    public static NotFoundObjectResult NotFound(Dictionary<string, string> errors)
    {
        return new NotFoundObjectResult(new {
            type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.5",
            title = "One or more validation errors occurred.",
            status = 404,
            errors
        });
    }

    public static ConflictObjectResult Conflict(Dictionary<string, string> errors, string? message = null)
    {
        return new ConflictObjectResult(new {
            type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.10",
            title = "Confirmation required.",
            status = 409,
            requiresConfirmation = true,
            message = message ?? "Perubahan membutuhkan konfirmasi admin.",
            errors
        });
    }
}
