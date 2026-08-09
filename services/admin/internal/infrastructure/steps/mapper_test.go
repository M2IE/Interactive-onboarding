package steps

import (
	"testing"

	"github.com/M2IE/Interactive-onboarding/services/admin/internal/domain"
)

func TestToGenCreateStepParamsAllowsMissingNextURL(t *testing.T) {
	step := &domain.Step{
		Selector: "#target",
		Title:    "Title",
		Body:     "Body",
	}

	params := toGenCreateStepParams(step)

	if params.NextUrl.Valid {
		t.Fatal("NextUrl.Valid = true, want false")
	}
}

func TestToGenUpdateStepParamsMapsNextURL(t *testing.T) {
	nextURL := "/next"
	step := &domain.Step{
		Selector: "#target",
		Title:    "Title",
		Body:     "Body",
		NextURL:  &nextURL,
	}

	params := toGenUpdateStepParams(step)

	if !params.NextUrl.Valid || params.NextUrl.String != nextURL {
		t.Fatalf("NextUrl = %#v, want %q", params.NextUrl, nextURL)
	}
}
