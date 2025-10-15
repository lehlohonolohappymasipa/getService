using Microsoft.AspNetCore.Mvc;

namespace GetService.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HelloController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new { message = "Backend is Live!" });
    }
}
