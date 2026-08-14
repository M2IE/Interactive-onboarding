package pdfengine

import (
	"context"
	_ "embed"
	"fmt"
	gotemplate "text/template"

	"github.com/M2IE/Interactive-onboarding/pkg/pdfengine/elements"
	"github.com/gpdf-dev/gpdf/template"
)

//go:embed report.json
var reportTemplate string

type GPDFEngine struct{}

func NewGPDF() *GPDFEngine {
	return &GPDFEngine{}
}

func (e *GPDFEngine) GeneratePDF(_ context.Context, content elements.Content) ([]byte, error) {
	tmplText := content.Template
	if tmplText == "" {
		tmplText = reportTemplate
	}

	tmpl, err := gotemplate.New("report").Funcs(reportFuncMap()).Parse(tmplText)
	if err != nil {
		return nil, fmt.Errorf("parse report template: %w", err)
	}

	doc, err := template.FromTemplate(tmpl, content.Data,
		template.WithFont("DejaVuSans", elements.FontData),
		template.WithDefaultFont("DejaVuSans", 12),
	)
	if err != nil {
		return nil, fmt.Errorf("render report template: %w", err)
	}

	return doc.Generate()
}

func reportFuncMap() gotemplate.FuncMap {
	fm := template.TemplateFuncMap()
	fm["pieChart"] = elements.PieChart
	return fm
}
