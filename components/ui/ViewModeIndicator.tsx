{
  /* Black background with subtle border */
}
<div className="rounded-lg p-4 bg-black border border-gray-800">
  <Link
    href="/"
    onClick={() => isMobile && setIsMobileMenuOpen(false)}
    className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
  >
    <Image
      src="/images/logo-dark.svg"
      alt="PorchLite Logo"
      width={48}
      height={48}
      className="w-12 h-12 rounded-lg"
      priority
    />
    <div>
      <h1 className="text-lg font-bold text-white drop-shadow-lg">PorchLite</h1>
      <p className="text-xs text-gray-200 drop-shadow">For Shared Spaces</p>
    </div>
  </Link>
</div>;

{
  /* View Mode Indicator Component */
}
<div className="mb-4 p-3 border rounded-lg bg-gray-800 border-gray-700">
  <p className="text-sm font-medium text-white">
    👑 Currently viewing as: <strong>Owner/Manager</strong>
  </p>
</div>;
