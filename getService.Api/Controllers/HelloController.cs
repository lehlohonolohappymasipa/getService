using Microsoft.AspNetCore.Mvc;
using System;

namespace GetService.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
