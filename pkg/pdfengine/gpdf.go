package pdfengine

import (
	"context"

	"github.com/gpdf-dev/gpdf"
	"github.com/gpdf-dev/gpdf/document"
	"github.com/gpdf-dev/gpdf/pdf"
	"github.com/gpdf-dev/gpdf/template"
)

type GPDFEngine struct{}

func NewGPDF() *GPDFEngine {
	return &GPDFEngine{}
}

func (e *GPDFEngine) GeneratePDF(ctx context.Context, content Content) ([]byte, error) {
	doc := gpdf.NewDocument(
		gpdf.WithPageSize(gpdf.A4),
		gpdf.WithMargins(document.UniformEdges(document.Mm(20))),
		gpdf.WithFont("DejaVuSans", fontData),
		gpdf.WithDefaultFont("DejaVuSans", 12),
	)

	page := doc.AddPage()
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Text(content.Title,
				template.FontSize(24),
				template.Bold(),
				template.TextColor(pdf.RGBHex(0x1A1A2E)),
			)
		})
	})

	for _, el := range content.Elements {
		switch v := el.(type) {
		case Table:
			e.renderTable(page, v)
		case Paragraph:
			e.renderParagraph(page, v)
		}
	}

	return doc.Generate()
}

func (e *GPDFEngine) renderTable(page *template.PageBuilder, tbl Table) {
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Spacer(document.Mm(8))
			if tbl.Title != "" {
				c.Text(tbl.Title, template.FontSize(14), template.Bold())
				c.Spacer(document.Mm(4))
			}
			c.Table(tbl.Header, tbl.Rows,
				template.ColumnWidths(e.columnWidths(len(tbl.Header))...),
				template.TableHeaderStyle(
					template.TextColor(pdf.White),
					template.BgColor(pdf.RGBHex(0x1A237E)),
				),
				template.TableStripe(pdf.RGBHex(0xF5F5F5)),
			)
		})
	})
}

func (e *GPDFEngine) renderParagraph(page *template.PageBuilder, p Paragraph) {
	page.AutoRow(func(r *template.RowBuilder) {
		r.Col(12, func(c *template.ColBuilder) {
			c.Spacer(document.Mm(4))
			c.Text(p.Text)
		})
	})
}

func (e *GPDFEngine) columnWidths(cols int) []float64 {
	switch cols {
	case 2:
		return []float64{30, 70}
	case 3:
		return []float64{30, 40, 30}
	case 4:
		return []float64{10, 40, 25, 25}
	default:
		widths := make([]float64, cols)
		for i := range widths {
			widths[i] = 100.0 / float64(cols)
		}
		return widths
	}
}
