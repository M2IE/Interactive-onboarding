package pdfengine

// Base struct
type Content struct {
	Title    string
	Elements []Element
}

type Element interface {
	isElement()
}

// Sub elements

type Table struct {
	Title  string
	Header []string
	Rows   [][]string
}

func (Table) isElement() {}

type Paragraph struct {
	Text string
}

func (Paragraph) isElement() {}
