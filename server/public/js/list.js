const onSearch = () => {
  document.querySelector(".search-btn").addEventListener("click", () => {
    let keyword = document.querySelector(".search-box").value;
    location.replace(`/search?value=${keyword}`);
  });
};

const onAddDeleteBtn = () => {
  let deleteBtns = document.querySelectorAll(".delete-btn");

  deleteBtns.forEach((v) => {
    v.addEventListener("click", async (e) => {
      await axios.delete("/delete", { data: { _id: e.target.dataset.id } });

      let fadeOut = setInterval(() => {
        let target = e.target.parentNode;
        let opacity = Number(window.getComputedStyle(target).getPropertyValue("opacity"));

        if (opacity > 0) {
          opacity = opacity - 0.1;
          target.style.opacity = opacity;
        } else {
          target.remove();
          clearInterval(fadeOut);
        }
      }, 50);
    });
  });
};

const onAddEditBtn = () => {
  let editBtns = document.querySelectorAll(".edit-btn");

  editBtns.forEach((v) => {
    v.addEventListener("click", async (e) => {
      window.location.replace(`/edit/${e.target.dataset.id}`);
    });
  });
};

onSearch();
onAddDeleteBtn();
onAddEditBtn();
