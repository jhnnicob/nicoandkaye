$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$galleryRoot = Join-Path $PSScriptRoot '../assets/gallery'
$galleryPreviewRoot = Join-Path $galleryRoot 'previews'
New-Item -ItemType Directory -Force -Path $galleryPreviewRoot | Out-Null
$galleryCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$gallerySettings = New-Object System.Drawing.Imaging.EncoderParameters(1)
$gallerySettings.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]84)

try {
  foreach ($galleryFile in Get-ChildItem -LiteralPath $galleryRoot -File) {
    if ($galleryFile.Extension -notin @('.jpg', '.jpeg', '.png')) { continue }
    $galleryImage = [System.Drawing.Image]::FromFile($galleryFile.FullName)
    try {
      # Apply camera orientation before resampling, since previews omit EXIF.
      if ($galleryImage.PropertyIdList -contains 274) {
        $galleryOrientation = [BitConverter]::ToUInt16($galleryImage.GetPropertyItem(274).Value, 0)
        $galleryRotation = @{
          2 = [System.Drawing.RotateFlipType]::RotateNoneFlipX
          3 = [System.Drawing.RotateFlipType]::Rotate180FlipNone
          4 = [System.Drawing.RotateFlipType]::Rotate180FlipX
          5 = [System.Drawing.RotateFlipType]::Rotate90FlipX
          6 = [System.Drawing.RotateFlipType]::Rotate90FlipNone
          7 = [System.Drawing.RotateFlipType]::Rotate270FlipX
          8 = [System.Drawing.RotateFlipType]::Rotate270FlipNone
        }
        if ($galleryRotation.ContainsKey([int]$galleryOrientation)) {
          $galleryImage.RotateFlip($galleryRotation[[int]$galleryOrientation])
        }
      }
      $galleryScale = [Math]::Min([double]1.0, [double]1600 / [double][Math]::Max($galleryImage.Width, $galleryImage.Height))
      $galleryWidth = [Math]::Max(1, [int][Math]::Round($galleryImage.Width * $galleryScale))
      $galleryHeight = [Math]::Max(1, [int][Math]::Round($galleryImage.Height * $galleryScale))
      $galleryBitmap = New-Object System.Drawing.Bitmap($galleryWidth, $galleryHeight)
      try {
        $galleryGraphics = [System.Drawing.Graphics]::FromImage($galleryBitmap)
        try {
          $galleryGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $galleryGraphics.DrawImage($galleryImage, 0, 0, $galleryWidth, $galleryHeight)
        } finally { $galleryGraphics.Dispose() }
        $galleryTarget = [System.IO.Path]::GetFullPath((Join-Path $galleryPreviewRoot ($galleryFile.BaseName + '.jpg')))
        $galleryBitmap.Save($galleryTarget, $galleryCodec, $gallerySettings)
      } finally { $galleryBitmap.Dispose() }
    } finally { $galleryImage.Dispose() }
  }
} finally { $gallerySettings.Dispose() }
