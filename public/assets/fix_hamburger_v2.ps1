
$path1 = 'd:\web\efvf\public\css\dashboard.css'
$content1 = Get-Content $path1
# Replace the whole active hamburger block for perfection
$new_dashboard_active = @'
.dashboard-hamburger.active {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
}

.dashboard-hamburger.active span {
    position: absolute !important;
    margin: 0 !important;
    transition: all 0.3s ease !important;
}

.dashboard-hamburger.active span:nth-child(1) {
    transform: rotate(0deg) !important;
}

.dashboard-hamburger.active span:nth-child(2) {
    transform: rotate(60deg) !important;
    opacity: 1 !important;
}

.dashboard-hamburger.active span:nth-child(3) {
    transform: rotate(-60deg) !important;
}
'@

# We need to find the range. Based on previous view, it starts around 129
# Let's find the lines between 129 and 139 and replace them.
$startIndex1 = 127 # 0-indexed which corresponds to line 128
$endIndex1 = 138   # 0-indexed which corresponds to line 139
$content1 = ($content1[0..$startIndex1]) + $new_dashboard_active + ($content1[($endIndex1+1)..($content1.Length-1)])
$content1 | Set-Content $path1

$path2 = 'd:\web\efvf\public\css\responsive.css'
$content2 = Get-Content $path2
$new_resp_active = @'
.hamburger.active {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
}

.hamburger.active span {
    position: absolute !important;
    margin: 0 !important;
    transition: all 0.4s ease !important;
}

.hamburger.active span:nth-child(1) {
    transform: rotate(0deg) !important;
}

.hamburger.active span:nth-child(2) {
    transform: rotate(60deg) !important;
    opacity: 1 !important;
}

.hamburger.active span:nth-child(3) {
    transform: rotate(-60deg) !important;
}
'@

# In responsive.css it was around 785
$startIndex2 = 783 
$endIndex2 = 795
$content2 = ($content2[0..$startIndex2]) + $new_resp_active + ($content2[($endIndex2+1)..($content2.Length-1)])
$content2 | Set-Content $path2

Write-Host "Perfect Star Hamburger logic applied!"
