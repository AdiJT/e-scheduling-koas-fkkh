using Microsoft.AspNetCore.Mvc;

namespace ESchedulingKoasFKKH.Server.Helpers;

public static class HelpersFunctions
{
    public static BadRequestObjectResult BadRequest(Dictionary<string, string> errors)
    {
        return new BadRequestObjectResult(
        new {
            type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
            title = "One or more validation errors occurred.",
            status = 400,
            errors
        });
    }
}
