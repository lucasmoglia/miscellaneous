function InitDropDownList(comboId) {
    $("#" + comboId + " :selected").attr("selected", false);
    if ($("#" + comboId + " option[value = '0']").length > 0) {
        $("#" + comboId + " option").first().attr("selected", true);
    }
    else {
        $("#" + comboId).prepend("<option Value='0'>Seleccione un valor</option>");
        $("#" + comboId + " option").first().attr("selected", true);
    }
}

function HtmlRequest(url, parametros) {

    var datos = "";

    $.ajax({
        cache: false,
        url: url,
        async: false,
        type: 'POST',
        data: parametros,
        dataType: 'HTML',
        success: function (result) {
            datos = result;
        },
        error: function (jqXHR, textStatus, errorThrown) {

            alert(jqXHR.responseText);

        }
    });

    return datos;
}

function AjaxRequest(url, parametros) {

    var datos = "";

    $.ajax({
        cache: false,
        url: url,
        async: false,
        type: 'POST',
        data: parametros,
        dataType: 'json',
        success: function (result) {
            datos = result;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(jqXHR.responseText);
        }
    });

    return datos;
}