Add-Type -AssemblyName System.Drawing

$csharp = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class MascotMatte
{
    public static Bitmap ProcessDay(Bitmap src)
    {
        int w = src.Width;
        int h = src.Height;
        Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);

        BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData dstData = dst.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        int total = w * h;
        byte[] buffer = new byte[total * 4];
        System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, buffer, 0, buffer.Length);
        src.UnlockBits(srcData);

        // BFS Flood fill from outer borders
        // Distance or brightness
        // In Day Mode, background is white (254, 254, 254)
        bool[] visited = new bool[total];
        float[] bgWeight = new float[total]; // 1.0 = full background (transparent), 0.0 = full foreground (opaque)
        Queue<int> q = new Queue<int>();

        for (int x = 0; x < w; x++)
        {
            q.Enqueue(x);
            q.Enqueue((h - 1) * w + x);
        }
        for (int y = 0; y < h; y++)
        {
            q.Enqueue(y * w);
            q.Enqueue(y * w + (w - 1));
        }

        while (q.Count > 0)
        {
            int idx = q.Dequeue();
            if (visited[idx]) continue;

            int bIdx = idx * 4;
            int b = buffer[bIdx];
            int g = buffer[bIdx + 1];
            int r = buffer[bIdx + 2];

            int minVal = Math.Min(r, Math.Min(g, b));

            // Background threshold: > 240 is background/transition
            if (minVal >= 238)
            {
                visited[idx] = true;
                if (minVal >= 250)
                {
                    bgWeight[idx] = 1.0f; // completely transparent
                }
                else
                {
                    // Linear falloff between 238 and 250
                    bgWeight[idx] = (minVal - 238f) / (250f - 238f);
                }

                int x = idx % w;
                int y = idx / w;

                if (x > 0 && !visited[idx - 1]) q.Enqueue(idx - 1);
                if (x < w - 1 && !visited[idx + 1]) q.Enqueue(idx + 1);
                if (y > 0 && !visited[idx - w]) q.Enqueue(idx - w);
                if (y < h - 1 && !visited[idx + w]) q.Enqueue(idx + w);
            }
        }

        byte[] outBuf = new byte[total * 4];
        for (int i = 0; i < total; i++)
        {
            int bIdx = i * 4;
            float b = buffer[bIdx];
            float g = buffer[bIdx + 1];
            float r = buffer[bIdx + 2];

            float bg = bgWeight[i];
            if (bg >= 0.999f)
            {
                outBuf[bIdx] = 0;
                outBuf[bIdx + 1] = 0;
                outBuf[bIdx + 2] = 0;
                outBuf[bIdx + 3] = 0;
            }
            else if (bg <= 0.001f)
            {
                outBuf[bIdx] = (byte)b;
                outBuf[bIdx + 1] = (byte)g;
                outBuf[bIdx + 2] = (byte)r;
                outBuf[bIdx + 3] = 255;
            }
            else
            {
                // Defringe white: foreground alpha = 1 - bg
                float alpha = 1.0f - bg;
                // pixel = alpha * fg + (1-alpha) * 255
                // fg = (pixel - (1-alpha)*255) / alpha
                float fgR = Math.Max(0, Math.Min(255, (r - bg * 255f) / alpha));
                float fgG = Math.Max(0, Math.Min(255, (g - bg * 255f) / alpha));
                float fgB = Math.Max(0, Math.Min(255, (b - bg * 255f) / alpha));

                outBuf[bIdx] = (byte)fgB;
                outBuf[bIdx + 1] = (byte)fgG;
                outBuf[bIdx + 2] = (byte)fgR;
                outBuf[bIdx + 3] = (byte)(alpha * 255f);
            }
        }

        System.Runtime.InteropServices.Marshal.Copy(outBuf, 0, dstData.Scan0, outBuf.Length);
        dst.UnlockBits(dstData);
        return dst;
    }

    public static Bitmap ProcessDark(Bitmap src)
    {
        int w = src.Width;
        int h = src.Height;
        Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);

        BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData dstData = dst.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        int total = w * h;
        byte[] buffer = new byte[total * 4];
        System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, buffer, 0, buffer.Length);
        src.UnlockBits(srcData);

        // Dark background target: (4, 15, 33)
        float targetR = 4f, targetG = 15f, targetB = 33f;

        bool[] visited = new bool[total];
        float[] bgWeight = new float[total];
        Queue<int> q = new Queue<int>();

        for (int x = 0; x < w; x++)
        {
            q.Enqueue(x);
            q.Enqueue((h - 1) * w + x);
        }
        for (int y = 0; y < h; y++)
        {
            q.Enqueue(y * w);
            q.Enqueue(y * w + (w - 1));
        }

        while (q.Count > 0)
        {
            int idx = q.Dequeue();
            if (visited[idx]) continue;

            int bIdx = idx * 4;
            float b = buffer[bIdx];
            float g = buffer[bIdx + 1];
            float r = buffer[bIdx + 2];

            float dist = (float)Math.Sqrt((r - targetR) * (r - targetR) + (g - targetG) * (g - targetG) + (b - targetB) * (b - targetB));

            // Background threshold: dist < 25
            if (dist <= 25f)
            {
                visited[idx] = true;
                if (dist <= 10f)
                {
                    bgWeight[idx] = 1.0f;
                }
                else
                {
                    bgWeight[idx] = 1.0f - ((dist - 10f) / 15f);
                }

                int x = idx % w;
                int y = idx / w;

                if (x > 0 && !visited[idx - 1]) q.Enqueue(idx - 1);
                if (x < w - 1 && !visited[idx + 1]) q.Enqueue(idx + 1);
                if (y > 0 && !visited[idx - w]) q.Enqueue(idx - w);
                if (y < h - 1 && !visited[idx + w]) q.Enqueue(idx + w);
            }
        }

        byte[] outBuf = new byte[total * 4];
        for (int i = 0; i < total; i++)
        {
            int bIdx = i * 4;
            float b = buffer[bIdx];
            float g = buffer[bIdx + 1];
            float r = buffer[bIdx + 2];

            float bg = bgWeight[i];
            if (bg >= 0.999f)
            {
                outBuf[bIdx] = 0;
                outBuf[bIdx + 1] = 0;
                outBuf[bIdx + 2] = 0;
                outBuf[bIdx + 3] = 0;
            }
            else if (bg <= 0.001f)
            {
                outBuf[bIdx] = (byte)b;
                outBuf[bIdx + 1] = (byte)g;
                outBuf[bIdx + 2] = (byte)r;
                outBuf[bIdx + 3] = 255;
            }
            else
            {
                float alpha = 1.0f - bg;
                float fgR = Math.Max(0, Math.Min(255, (r - bg * targetR) / alpha));
                float fgG = Math.Max(0, Math.Min(255, (g - bg * targetG) / alpha));
                float fgB = Math.Max(0, Math.Min(255, (b - bg * targetB) / alpha));

                outBuf[bIdx] = (byte)fgB;
                outBuf[bIdx + 1] = (byte)fgG;
                outBuf[bIdx + 2] = (byte)fgR;
                outBuf[bIdx + 3] = (byte)(alpha * 255f);
            }
        }

        System.Runtime.InteropServices.Marshal.Copy(outBuf, 0, dstData.Scan0, outBuf.Length);
        dst.UnlockBits(dstData);
        return dst;
    }
}
'@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

function Optimize404Image($svgPath, $isDark, $outSvgPath) {
    $svg = [System.IO.File]::ReadAllText($svgPath)
    $m = [regex]::Match($svg, "data:image/jpeg;base64,([A-Za-z0-9+/=]+)")
    if (-not $m.Success) {
        Write-Error "Could not find base64 JPEG in $svgPath"
        return
    }

    $bytes = [Convert]::FromBase64String($m.Groups[1].Value)
    $ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
    $bmp = [System.Drawing.Bitmap]::FromStream($ms)

    # 640x640 Retina resolution
    $target = 640
    $resized = New-Object System.Drawing.Bitmap($target, $target, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($bmp, 0, 0, $target, $target)
    $g.Dispose()
    $bmp.Dispose()
    $ms.Dispose()

    # Process matte/transparency
    if ($isDark) {
        $trans = [MascotMatte]::ProcessDark($resized)
    } else {
        $trans = [MascotMatte]::ProcessDay($resized)
    }
    $resized.Dispose()

    # Save to memory stream as PNG (PNG supports full alpha transparency)
    $outMs = New-Object System.IO.MemoryStream
    $trans.Save($outMs, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $outMs.ToArray()
    $trans.Dispose()
    $outMs.Dispose()

    $b64Png = [Convert]::ToBase64String($pngBytes)
    $title = if ($isDark) { "BugSnap 404 Dark" } else { "BugSnap 404" }
    $svgOut = @"
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 $target $target" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <title>$title</title>
  <image width="$target" height="$target" href="data:image/png;base64,$b64Png" />
</svg>
"@

    [System.IO.File]::WriteAllText($outSvgPath, $svgOut)
    Write-Output "Generated $outSvgPath : $($pngBytes.Length) PNG bytes, $([System.IO.File]::ReadAllBytes($outSvgPath).Length) SVG bytes"
}

Optimize404Image "D:\Akusara\image logo\bugsnap - 404.svg" $false "public\bugsnap-404.svg"
Optimize404Image "D:\Akusara\image logo\bugsnap - 404 dark mode.svg" $true "public\bugsnap-404-dark.svg"
