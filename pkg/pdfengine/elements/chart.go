package elements

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"math"

	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

var sliceColors = map[string]color.RGBA{
	"indigo": {R: 0x1A, G: 0x23, B: 0x7E, A: 0xFF},
	"green":  {R: 0x2E, G: 0x7D, B: 0x32, A: 0xFF},
	"red":    {R: 0xC6, G: 0x28, B: 0x28, A: 0xFF},
	"orange": {R: 0xEF, G: 0x6C, B: 0x00, A: 0xFF},
	"purple": {R: 0x45, G: 0x29, B: 0x7A, A: 0xFF},
	"teal":   {R: 0x00, G: 0x83, B: 0x8F, A: 0xFF},
	"gray":   {R: 0xE0, G: 0xE0, B: 0xE0, A: 0xFF},
}

var defaultSliceColors = []string{"indigo", "green", "red", "orange", "purple", "teal"}

const (
	chartWidth  = 400
	chartHeight = 300
	chartCX     = 150
	chartCY     = 150
	chartOuter  = 140
	chartInner  = 78
)

func PieChart(metrics []Metric) (string, error) {
	pngBytes, err := renderPieChart(metrics)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(pngBytes), nil
}

func renderPieChart(metrics []Metric) ([]byte, error) {
	img := image.NewRGBA(image.Rect(0, 0, chartWidth, chartHeight))
	draw.Draw(img, img.Bounds(), &image.Uniform{C: color.White}, image.Point{}, draw.Src)

	total := 0
	for _, m := range metrics {
		total += m.Value
	}

	face, err := loadChartFont()
	if err != nil {
		return nil, err
	}

	if total <= 0 {
		fillSlice(img, 0, 360, sliceColors["gray"])
	} else {
		start := 0.0
		for i, m := range metrics {
			if m.Value <= 0 {
				continue
			}
			sweep := float64(m.Value) / float64(total) * 360

			fillSlice(img, start, sweep, sliceColors[defaultSliceColors[i%len(defaultSliceColors)]])
			drawSliceLabel(img, face, start+sweep/2, fmt.Sprintf("%.1f%%", float64(m.Value)/float64(total)*100))

			start += sweep
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func loadChartFont() (font.Face, error) {
	f, err := opentype.Parse(FontData)
	if err != nil {
		return nil, err
	}
	return opentype.NewFace(f, &opentype.FaceOptions{
		Size:    14,
		DPI:     72,
		Hinting: font.HintingFull,
	})
}

func fillSlice(img *image.RGBA, startDeg, sweepDeg float64, c color.RGBA) {
	for y := range chartHeight {
		for x := range chartWidth {
			dx := float64(x - chartCX)
			dy := float64(y - chartCY)
			dist := math.Hypot(dx, dy)
			if dist > chartOuter || dist < chartInner {
				continue
			}

			deg := math.Mod(math.Atan2(dy, dx)*180/math.Pi+450, 360)
			if rel := math.Mod(deg-startDeg+360, 360); rel >= sweepDeg {
				continue
			}

			a := 1.0
			if d := chartOuter - dist; d < 1 {
				a = d
			}
			if d := dist - chartInner; d < 1 && d < a {
				a = d
			}

			dst := img.RGBAAt(x, y)
			img.SetRGBA(x, y, color.RGBA{
				R: uint8(float64(dst.R)*(1-a) + float64(c.R)*a),
				G: uint8(float64(dst.G)*(1-a) + float64(c.G)*a),
				B: uint8(float64(dst.B)*(1-a) + float64(c.B)*a),
				A: 0xFF,
			})
		}
	}
}

func drawSliceLabel(img *image.RGBA, face font.Face, midDeg float64, label string) {
	rad := midDeg * math.Pi / 180
	r := float64(chartOuter+chartInner) / 2
	tx := chartCX + math.Sin(rad)*r
	ty := chartCY - math.Cos(rad)*r

	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(color.White),
		Face: face,
	}
	w := d.MeasureString(label).Ceil()
	d.Dot = fixed.P(int(math.Round(tx))-w/2, int(math.Round(ty)))
	d.DrawString(label)
}
