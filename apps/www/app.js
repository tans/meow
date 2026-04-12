$(function () {
  $("a[href^='#']").on("click", function (event) {
    const target = $(this.getAttribute("href"));
    if (!target.length) {
      return;
    }
    event.preventDefault();
    $("html, body").animate(
      {
        scrollTop: target.offset().top - 24,
      },
      450,
    );
  });
});
