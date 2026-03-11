
$path1 = 'd:\web\efvf\public\css\dashboard.css'
$content1 = Get-Content $path1
$content1[129] = '    transform: translateY(9px) rotate(60deg);'
$content1[133] = '    opacity: 1; transform: rotate(0deg);'
$content1[137] = '    transform: translateY(-9px) rotate(-60deg);'
$content1 | Set-Content $path1

$path2 = 'd:\web\efvf\public\css\responsive.css'
$content2 = Get-Content $path2
# Line numbers in G-C are 0-based
$content2[785] = '    transform: translateY(8px) rotate(60deg);'
$content2[789] = '    opacity: 1; transform: rotate(0deg);'
$content2[790] = '    /* middle line visible */'
$content2[794] = '    transform: translateY(-8px) rotate(-60deg);'
$content2 | Set-Content $path2

Write-Host "Hamburger states updated successfully!"
