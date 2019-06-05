const lineChart = Vue.component('line-chart', {
  props: ['title', 'chartid', 'chart-data'],
  template: `
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">{{ title }}</h5>
      <div :id="chartid" class="chart" chart-data="chart-data"></div>
    </div>
  </div>`,
  data() {
    return {
      chart: undefined
    }
  },
  mounted() {
    let chartid = this.chartid
    this.chart = Highcharts.chart(chartid, {
      chart: {
        zoomType: 'x'
      },
      title: {
        text: ''
      },
      yAxis: {
        title: ''
      },
      tooltip: {
        valueSuffix: ' mV'
      },
      tooltip: {
        valueDecimals: 2
      },
      series: [{
        data: this.chartData,
        name: '',
        lineWidth: 0.8,
        showInLegend: false,
        turboThreshold: 500000
      }]
    })
  }
});

const areaChart = Vue.component('area-chart', {
  props: ['title', 'chartid', 'chart-data', 'xaxis-categories'],
  template: `
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">{{ title }}</h5>
      <div :id="chartid" class="chart" chart-data="chart-data"></div>
    </div>
  </div>`,
  data() {
    return {
      chart: undefined
    }
  },
  mounted() {
    let chartid = this.chartid;
    this.chart = Highcharts.chart(chartid, {
      chart: {
        type: 'area',
        zoomType: 'x'
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: this.xaxisCategories,
        labels: {
          formatter() {
            return (this.value).toFixed(2)
          }
        }
      },
      yAxis: {
        title: ''
      },
      tooltip: {
        valueSuffix: ' mV'
      },
      tooltip: {
        valueDecimals: 2
      },
      series: [{
        data: this.chartData,
        name: '',
        lineWidth: 0.8,
        showInLegend: false,
        turboThreshold: 500000
      }]
    })
  }
});

var app = new Vue({
  el: '#app',
  data() {
    return {
      health_heart_rate: false,
      comment: '',
      lf_hf: 0,
      hf: 0,
      lf: 0,
      PN50: 0,
      heart_rate: 0,
      sdnn: 0,
      // charts
      lineCharts: [],
      areaCharts: [],
      // loding check
      loading: false,
    }
  },
  components: { lineChart, areaChart },
  created() {
    // this.lodingCSV();
  },
  methods: {
    onFileChange() {
      let my = this;
      let file = document.getElementById('inputCSV').files;

      if (!file.length) {
        swal({
          icon: 'error',
          title: '請載入檔案'
        });
      }
      else {
        Papa.parse(file[0], {
          header: true,
          complete: function (results) {
            results = results.data;

            let sol = results.map((item, index) => {
              return _.toNumber(item.ECG2);
            });
            sol.pop();
            my.lodingCSV(sol);
          }
        });
      }
    },
    lodingCSV(inputData) {
      this.loading = true;

      let formData = new FormData();
      formData.append('data', JSON.stringify(inputData));
      // console.log(formData.get('data'));

      // fetch('./data/demo.json')
      // fetch('http://127.0.0.1:8080/api/heap', {
      fetch('http://140.113.168.102:8080/api/heap', {
        method: 'POST',
        body: formData
      })
        .then((response) => {
          return response.json();
          // return response.text();
        })
        .then((apiResp) => {
          console.log(apiResp);
          let needChart = ['org_graph', 'psd', 'base_line_0'];
          let psd = JSON.parse(apiResp['psd']);

          let xAxisCategories = [];
          for (let i = 0; i < psd['magnitude'].length; i++) {
            xAxisCategories.push(i * psd['df']);
          }

          this.lineCharts = [
            {
              chartid: 'org_graph',
              title: 'Original singal',
              data: JSON.parse(apiResp['org_graph'])
            }, {
              chartid: 'base_line_0',
              title: 'Base line = 0',
              data: JSON.parse(apiResp['base_line_0'])
            }
          ];

          this.areaCharts = [
            {
              chartid: 'psd',
              title: 'PSD',
              data: psd['magnitude'],
              xAxisCategories: xAxisCategories,
            }
          ];

          this.health_heart_rate = apiResp['health_heart_rate'] ? true : false;
          this.heart_rate = apiResp['heart_rate'];
          this.sdnn = JSON.parse(apiResp['sdnn'])[0].toFixed(2);
          this.PN50 = apiResp['PN50'];

          this.lf = (apiResp['lf']*100).toFixed(2);
          this.hf = (apiResp['hf']*100).toFixed(2);
          this.lf_hf = apiResp['lf_hf'].toFixed(2);

          this.comment = apiResp['comment'];

          this.loading = false;
        })
    }
  }
})
