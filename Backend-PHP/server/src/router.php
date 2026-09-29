<?php
// Tiny Express-style router: '/api/posts/:slug' → ['slug' => '…'].

class Router
{
    private array $routes = [];

    public function get(string $path, callable $fn): void { $this->add('GET', $path, $fn); }
    public function post(string $path, callable $fn): void { $this->add('POST', $path, $fn); }
    public function put(string $path, callable $fn): void { $this->add('PUT', $path, $fn); }
    public function patch(string $path, callable $fn): void { $this->add('PATCH', $path, $fn); }
    public function delete(string $path, callable $fn): void { $this->add('DELETE', $path, $fn); }

    private function add(string $method, string $path, callable $fn): void
    {
        $names = [];
        $regex = preg_replace_callback(
            '#:(\w+)|([^:]+)#',
            function ($m) use (&$names) {
                if (($m[1] ?? '') !== '') { $names[] = $m[1]; return '([^/]+)'; }
                return preg_quote($m[2], '#');
            },
            $path
        );
        $this->routes[] = [$method, "#^$regex/?$#i", $names, $fn];
    }

    /** Runs the matching route. Returns false when nothing matched. */
    public function dispatch(string $method, string $path): bool
    {
        if ($method === 'HEAD') $method = 'GET';
        foreach ($this->routes as [$m, $regex, $names, $fn]) {
            if ($m !== $method || !preg_match($regex, $path, $match)) continue;
            $params = [];
            foreach ($names as $i => $name) $params[$name] = rawurldecode($match[$i + 1]);
            $fn($params);
            return true;
        }
        return false;
    }
}
