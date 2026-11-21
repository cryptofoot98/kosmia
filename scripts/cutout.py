"""Cuts the Home figures out of the flat grey they are painted on (craft-atlas.mjs paints fg-* alone on #808080), so they
can stand in front of the forecast card; also cuts the golden halo disc out of its painting.

    python scripts/cutout.py <dir of the original paintings>

Grey connected to the edges becomes transparent, with a soft ramp at the boundary; enclosed grey holes (between an arm
and the body) go too; the grey that bled into semi-transparent edge pixels is taken back out so no light fringe shows
against the navy sky. Every figure keeps its full square, so all twelve share one coordinate system in the scene.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = sys.argv[1]
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art', 'atlas')

def cut(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    border = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    neutral = border[(border.max(axis=1) - border.min(axis=1)) < 10]  # the figure covers parts of the border
    bg = np.median(neutral if len(neutral) > 50 else border, axis=0)
    d = np.abs(a - bg).max(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    loose = d < 42
    lab, n = ndimage.label(loose)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bgmask = np.isin(lab, edge[edge > 0])
    # enclosed holes: tight colour match, neutral, and big enough not to be a highlight
    tight = (d < 14) & (sat < 12)
    tl, tn = ndimage.label(tight)
    if tn:
        sizes = ndimage.sum(tight, tl, range(1, tn + 1))
        big = np.isin(tl, np.nonzero(sizes > 400)[0] + 1)
        bgmask |= ndimage.binary_dilation(big, iterations=2) & loose
    alpha = np.ones((h, w), np.float32)
    alpha[bgmask] = np.clip((d[bgmask] - 14) / 28, 0, 1)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    alpha[alpha < 0.04] = 0
    # take the grey back out of the edge pixels
    k = alpha[..., None]
    rgb = np.where(k > 0.02, (a - (1 - k) * bg) / np.maximum(k, 0.02), a)
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

for f in sorted(os.listdir(SRC)):
    n = f[:-5]
    if n.startswith('fg-'):
        out = cut(Image.open(os.path.join(SRC, f))).resize((900, 900), Image.LANCZOS)
    elif n == 'home-halo':
        im = Image.open(os.path.join(SRC, f)).convert('RGB'); a = np.asarray(im).astype(int)
        gold = (a[..., 0] > 150) & (a[..., 0] - a[..., 2] > 50)
        gold[int(a.shape[0] * .55):] = False  # the moon is in the upper half of the painting
        ys, xs = np.nonzero(gold)
        cx, cy = int(np.median(xs)), int(np.median(ys))
        r = int(min(np.percentile(xs, 99) - np.percentile(xs, 1), np.percentile(ys, 99) - np.percentile(ys, 1)) / 2 * .95)  # inside the rim
        sq = im.crop((cx - r, cy - r, cx + r, cy + r)).resize((560, 560), Image.LANCZOS).convert('RGBA')
        m = Image.new('L', (2240, 2240), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(m).ellipse((8, 8, 2232, 2232), fill=255)
        sq.putalpha(m.resize((560, 560), Image.LANCZOS))
        out = sq
    else:
        continue
    p = os.path.join(D, n + '.webp')
    out.save(p, quality=86, method=6)
    print(n, out.size, os.path.getsize(p) // 1024, 'KB')
