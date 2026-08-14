package elements

type ReportData struct {
	Title          string
	Subtitle       string
	Date           string
	Metrics        []Metric
	CompletionRate string
	FunnelRows     [][]string
	StepRows       [][]string
	Findings       []string
}
