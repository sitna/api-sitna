
<script type="text/javascript">
    (async () => {
		document.addEventListener("DOMContentLoaded", async (event) => {
		const content = await fetch("../Examples/");
        const xml = await content.text();
		const container = document.querySelector("#founded");
		const counter = document.querySelector("#ejemplos-encontrados");
		let lastPattern="";
		//mover el cuadro buscador
		const searchBlock=document.querySelector("#search-block");
		searchBlock.parentElement.removeChild(searchBlock);
		document.querySelectorAll(".col-md-3.side-content > *").forEach((children)=>children.parentElement.removeChild(children));
		document.querySelector(".col-md-3.side-content").appendChild(searchBlock);

		counter.innerText= counter.innerText + " (0)";

		const AddHighLight=(text,pattern)=>{
			return  text.replace(new RegExp(pattern,'gmi'),'<span class="highlight">$&</span>')
		}
			
		const paintToast=(itemData,pattern)=>{
			const li=document.createElement("li");
			const link=document.createElement("a");
			link.href="../examples/" + itemData["id"];
			link.target="_blank";
			if(pattern)
				link.innerHTML="<p class=\"title\">" + AddHighLight(itemData.title,pattern) + "</p><p class=\"summary\">" + AddHighLight(itemData.summary || "",pattern) + "</p>";
			else
				link.innerHTML="<p class=\"title\">" + itemData.title + "</p><p class=\"summary\">" + itemData.summary || "" + "</p>";
			li.appendChild(link);
			container.appendChild(li);
		}
		var index;

		var store;
			
		const defaultState=async()=>{
			container.querySelectorAll("li").forEach((li)=>{
				li.parentElement.removeChild(li);
			});
			const response = await fetch("lunr-data.json")
			const data = await response.json();
			store=data.store;
			index = lunr.Index.load(data.index);
			for(let i in store) paintToast(store[i]);
			
			counter.innerText= counter.innerText.replace(/\d+/gm,Object.entries(store).length);
		}
			
		defaultState();
			
		const search=(pattern)=>{
			if(pattern===lastPattern)
				return;
			const results = index.search("*" + pattern + "*");
			container.querySelectorAll("li").forEach((li)=>{
					li.parentElement.removeChild(li);
			})
			if (results.length > 0){
				//pintar resultados
				//vaciar el contenedor
					
				results.sort((a, b) => a.score - b.score).forEach((result)=>{
					paintToast(store[result.ref],pattern);						
				});

			}
			lastPattern = pattern;
			counter.innerText= counter.innerText.replace(/\d+/gm,results.length);
		}
		document.querySelector("#txtSearch").addEventListener("keyup", (event) => {			
			if(event.currentTarget.value)	
				search(event.currentTarget.value);
			else
				defaultState();
		})           
        
		document.querySelector("#btnClear").addEventListener("click", (event) => {
			document.querySelector("#txtSearch").value="";
			defaultState();
		})
	});
    })();
</script>

<style>
	#search-block{
		display:flex;
	}
	#txtSearch{
		width: calc(100% - 3em);
	}
	#founded li{
		list-style: none;
		flex-basis: 32%;
		display: block;
		margin-bottom: 1em;					
		border:1px solid #ccc;
		border-radius:1em;
	}
	#founded li a{
		padding:0.5em;
		display:block;
		text-decoration:none;
	}
	#founded li .title{
		font-weight:bold;
	}
	#founded li .summary{
		font-size:80%;
		font-style: italic;
	}
	#founded
	{    padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-start;
		gap:1%;
	}
	#founded li a:hover{
		background-color: #f6f6f6;
		border-radius: 1em;
	}
	.highlight{background-color:yellow}

</style>

<div id="search-block">
	<input type="search" class="form-control" id="txtSearch" placeholder="filtrar ejemplos" />
	<div class="input-group-btn">
		<button class="btn btn-default" id="btnClear">
			<i class="glyphicon glyphicon-remove"></i>
		</button>
	</div>
</div>

## Ejemplos encontrados
<ul id="founded"></ul>


