package pdfengine

import (
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"sync"

	gopdf "github.com/signintech/gopdf"
)

// go embed DejaVuSans.ttf (add : after "go" to use)
var fontData []byte

var fontOnce sync.Once
var fontLoadErr error

type SignintechEngine struct{}

func NewSignintech() *SignintechEngine {
	return &SignintechEngine{}
}

func (e *SignintechEngine) GeneratePDF(ctx context.Context, content Content) ([]byte, error) {
	pdf := &gopdf.GoPdf{}
	pdf.Start(gopdf.Config{PageSize: *gopdf.PageSizeA4})
	pdf.AddPage()

	if err := setFont(pdf, 20); err != nil {
		return nil, err
	}

	if err := e.addHeading(pdf, content.Title); err != nil {
		return nil, err
	}

	for _, el := range content.Elements {
		switch v := el.(type) {
		case Table:
			e.renderTable(pdf, v)
		case Paragraph:
			e.renderParagraph(pdf, v)
		}
	}

	var buf bytes.Buffer
	if _, err := pdf.WriteTo(&buf); err != nil {
		return nil, fmt.Errorf("write pdf: %w", err)
	}

	return buf.Bytes(), nil
}

func (e *SignintechEngine) addHeading(pdf *gopdf.GoPdf, title string) error {
	if err := setFont(pdf, 20); err != nil {
		return err
	}
	pdf.SetX(50)
	pdf.SetY(40)
	return pdf.Cell(nil, title)
}

func (e *SignintechEngine) renderParagraph(pdf *gopdf.GoPdf, p Paragraph) {
	setFont(pdf, 12)
	pdf.SetX(50)
	pdf.Br(18)
	pdf.Cell(nil, p.Text)
	pdf.Br(14)
}

func (e *SignintechEngine) renderTable(pdf *gopdf.GoPdf, tbl Table) {
	setFont(pdf, 12)
	y := pdf.GetY() + 10

	if tbl.Title != "" {
		pdf.SetX(50)
		pdf.SetY(y)
		pdf.Cell(nil, tbl.Title)
		y += 24
	}

	colW := e.columnWidths(len(tbl.Header))
	x := 50.0
	for i, h := range tbl.Header {
		pdf.SetX(x)
		pdf.SetY(y)
		pdf.Cell(nil, h)
		x += colW[i]
	}
	y += 20

	setFont(pdf, 10)
	for _, row := range tbl.Rows {
		x = 50.0
		for i, cell := range row {
			pdf.SetX(x)
			pdf.SetY(y)
			pdf.Cell(nil, cell)
			x += colW[i]
		}
		y += 18
	}
}

func (e *SignintechEngine) columnWidths(cols int) []float64 {
	switch cols {
	case 2:
		return []float64{120, 310}
	case 3:
		return []float64{120, 160, 150}
	case 4:
		return []float64{30, 200, 60, 70}
	default:
		w := 430.0 / float64(cols)
		widths := make([]float64, cols)
		for i := range widths {
			widths[i] = w
		}
		return widths
	}
}

func setFont(pdf *gopdf.GoPdf, size float64) error {
	fontOnce.Do(func() {
		fontLoadErr = pdf.AddTTFFontData("Main", fontData)
	})
	if fontLoadErr != nil {
		return fontLoadErr
	}
	return pdf.SetFont("Main", "", int(size))
}
