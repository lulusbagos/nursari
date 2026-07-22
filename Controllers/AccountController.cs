using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nursari.Models;

namespace Nursari.Controllers
{
    public class AccountController : Controller
    {
        private readonly NurseryContext _context;

        public AccountController(NurseryContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Login()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(string email, string password, bool rememberMe)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                ModelState.AddModelError(string.Empty, "Email dan Kata Sandi wajib diisi.");
                return View();
            }

            // Find user (case-insensitive for username or no_nik)
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username.ToLower() == email.ToLower() || u.NoNik.ToLower() == email.ToLower());

            if (user == null || user.Password != password)
            {
                ModelState.AddModelError(string.Empty, "Username/NIK atau Password salah.");
                return View();
            }

            if (user.Status != "Active")
            {
                ModelState.AddModelError(string.Empty, "Akun Anda dinonaktifkan.");
                return View();
            }

            // Create claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = rememberMe,
                ExpiresUtc = rememberMe ? DateTimeOffset.UtcNow.AddDays(7) : DateTimeOffset.UtcNow.AddHours(8)
            };

            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

            // Log login event in audit trail
            var log = new AuditTrail
            {
                Id = "AUD-" + Guid.NewGuid().ToString("N").Substring(0, 9).ToUpper(),
                User = user.Name,
                Module = "Authentication",
                Activity = "LOGIN",
                BeforeValue = "N/A",
                AfterValue = $"User logged in with role: {user.Role}",
                Timestamp = DateTime.UtcNow.ToString("o")
            };
            _context.AuditTrails.Add(log);
            await _context.SaveChangesAsync();

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var userName = User.Identity.Name ?? "User";
                
                // Log logout event in audit trail
                var log = new AuditTrail
                {
                    Id = "AUD-" + Guid.NewGuid().ToString("N").Substring(0, 9).ToUpper(),
                    User = userName,
                    Module = "Authentication",
                    Activity = "LOGOUT",
                    BeforeValue = "N/A",
                    AfterValue = "User logged out.",
                    Timestamp = DateTime.UtcNow.ToString("o")
                };
                _context.AuditTrails.Add(log);
                await _context.SaveChangesAsync();
            }

            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login");
        }
    }
}
