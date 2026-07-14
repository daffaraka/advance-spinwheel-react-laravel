import re

with open('app/Http/Controllers/ApiController.php', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace platform condition for participants
c = re.sub(
    r"Participant::where\('platform', \$platform\)",
    r"Participant::whereIn('platform', $platform === 'mix' ? ['tiktok', 'shopee'] : [$platform])",
    c
)

# Also fix the validation rules
c = re.sub(
    r"'platform' => 'required\|in:tiktok,shopee'",
    r"'platform' => 'required|in:tiktok,shopee,mix'",
    c
)

c = re.sub(
    r"'platform' => 'required\|string\|in:tiktok,shopee'",
    r"'platform' => 'required|string|in:tiktok,shopee,mix'",
    c
)

c = re.sub(
    r"in_array\(\$platform, \['tiktok', 'shopee'\]\)",
    r"in_array($platform, ['tiktok', 'shopee', 'mix'])",
    c
)

# And for searchParticipants where it uses strtolower($request->platform)
c = re.sub(
    r"Participant::where\('platform', strtolower\(\$request->platform\)\)",
    r"Participant::whereIn('platform', strtolower($request->platform) === 'mix' ? ['tiktok', 'shopee'] : [strtolower($request->platform)])",
    c
)


with open('app/Http/Controllers/ApiController.php', 'w', encoding='utf-8') as f:
    f.write(c)

print("done")
