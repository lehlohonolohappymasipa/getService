using Microsoft.AspNetCore.Mvc;
using System;

namespace GetService.Api.Controllers
{
    [ApiController]
    // Keep route explicit to avoid accidental collisions with minimal APIs
    [Route("api/hello")]
    public class HelloController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            var response = new { message = "Hello from GetService API!", timestamp = DateTime.UtcNow };
            return Ok(response);
        }
    }
}
