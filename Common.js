/*------------------Summary-------------------------------------------------------------------------------
ComboId: Es el attribute 'id' del combo que se intenta inicializar.
FirstMessage: Permite customizar el mensaje que se muestra en el elemento 0 del select. (El primero)
                Enjoy! 
----------------------------------------------------------------------------------------------------------*/
function InitDropDownList(comboId, firstMessage) {
    if (firstMessage == null || firstMessage == "") { firstMessage = "Seleccione..."; }

    $("#" + comboId + " :selected").attr("selected", false);
    if ($("#" + comboId + " option[value = '0']").length > 0) {
        $("#" + comboId + " option").first().attr("selected", true);
    }
    else {
        $("#" + comboId).prepend("<option Value='0'>" + firstMessage + "</option>");
        $("#" + comboId + " option").first().attr("selected", true);
    }
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

/*------------------Summary-------------------------------------------------------------------------------
Para utilizar este método es necesario tener en cuenta las condiciones U.U
y la consistencia de los parametros que se le otorgan...por un parametro mal pasado, puede no funcionar :P.
Combo1: Es el dropDownList que está arriba.
Combo2: Es el dropDownList dependiente, que está abajo.
urlMethod: Método alojado en algun Controller o Handler para colectar datos mediante un AjaxRequest.
paramSelector: ie. $("#example") ... se le pasa el selector armado del campo que contiene el / los
                parámetros para ir a buscar los datos. Como no existe la sobrecarga, hay que agregar la 
                cantidad de parámetros que se necesiten a mano e ir evaluando su condición de null. =)
FirstMessage: Permite customizar el mensaje que se muestra en el elemento 0 del select. (El primero)
                Enjoy! 
initAfterPopulate: Indica si se debe inicializar el combo luego de llenarlo.
----------------------------------------------------------------------------------------------------------*/
function CascadingCombo(combo1, combo2, urlMethod, paramSelector, paramSelector2, FirstMessage, initAfterPopulate) {
        combo1.change(function () {
        if (paramSelector2 != null) {
            var result = AjaxRequest(urlMethod, { parameter1: paramSelector.val(), parameter2: paramSelector2.val() });
            PopulateCombo(combo2, result);
        }
        else {
            var result = AjaxRequest(urlMethod, { parameter1: paramSelector.val() });
            PopulateCombo(combo2, result);
        }/**/
        if (initAfterPopulate != null && initAfterPopulate != "" && initAfterPopulate == true) {
            InitDropDownList($(combo2).attr('id'), FirstMessage);
        }
        combo2.trigger('liszt:updated');
    });
}

function PopulateCombo(combo2, data) {

    var ddl = combo2;
    ddl.empty();

    if (data == null) {
        $(document.createElement('option'))
            .attr('value', "0")
            .text("Select a value")
            .appendTo(ddl);
    }
    else {
        $(data).each(function () {
            $(document.createElement('option'))
            .attr('value', this.Id)
            .text(this.Value)
            .appendTo(ddl);
        });
    }

    $("#ddlMateria").trigger('liszt:updated');
}

function TurnChosenAjaxOn(idCombo, urlGet) {
    var query = "";
    var input_width = "";
    var selected_options = "";

    $("#" + idCombo + "_chzn").children('.chzn-choices').find('input').autocomplete({
        source: function (request, response) {
            if (request.term != "") {
                $.ajax({
                    url: urlGet + "?query=" + request.term,
                    dataType: "json",
                    beforeSend: function () {
                        input_width = $("#" + idCombo + "_chzn").children('.chzn-choices').find('input').css("width");
                        query = $("#" + idCombo + "_chzn").children('.chzn-choices').find('input').val();
                        selected_options = $("#" + idCombo + " option:selected");
                        $("#" + idCombo).empty();
                    },
                    success: function (data) {

                        data = $.grep(data, function (item, index) {
                            return ($.grep(selected_options, function (option, i) {
                                return $(option).val() == item.Id.toString()}).length == 0)
                        });

                        $.each(selected_options, function (id, option) {
                            $("#" + idCombo).append(option);
                        });

                        response($.map(data, function (item) {
                            //$('ul.chzn-results').append('<li class="active-result">' + item.name + '</li>');
                            $("#" + idCombo).append($('<option></option>').val(item.Id).html(item.Value));
                        }));
                        $("#" + idCombo).trigger("liszt:updated");
                        $("#" + idCombo + "_chzn").children('.chzn-choices').find('input').val(query);
                        $("#" + idCombo + "_chzn").children('.chzn-choices').find('input').css("width", input_width);
                    }
                });
            }
            else {
                $("#" + idCombo).empty();
                $("#" + idCombo).trigger("liszt:updated");
            }
        }
    });
}