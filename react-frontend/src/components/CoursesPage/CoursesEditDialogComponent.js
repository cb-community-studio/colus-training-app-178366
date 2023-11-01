import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import client from "../../services/restClient";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';



const getSchemaValidationErrorsStrings = (errorObj) => {
    let errMsg = [];
    for (const key in errorObj.errors) {
        if (Object.hasOwnProperty.call(errorObj.errors, key)) {
            const element = errorObj.errors[key];
            if (element?.message) {
                errMsg.push(element.message);
            }
        }
    }
    return errMsg.length ? errMsg : errorObj.message ? errorObj.message : null;
};

const CoursesCreateDialogComponent = (props) => {
    const [_entity, set_entity] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [topics, settopics] = useState([])

    useEffect(() => {
        set_entity(props.entity);
    }, [props.entity, props.show]);
    
     useEffect(() => {
                    //on mount
                    client
                        .service("topics")
                        .find({ query: { $limit: 100 } })
                        .then((res) => {
                            settopics(res.data);
                            settopics(res.data.map((e) => ({ name: e['topicstitle'], value: e._id })));
                        })
                        .catch((error) => {
                            console.log({ error });
                            props.alert({ title: "Topics", type: "error", message: error.message || "Failed get topics" });
                        });
                }, []);

    const onSave = async () => {
        let _data = {
            title: _entity.title,
            topics: _entity.topics,
            datestart: _entity.datestart,
            dateend: _entity.dateend,
        };

        setLoading(true);
        try {
            
        await client.service("courses").patch(_entity._id, _data);
        const eagerResult = await client
            .service("courses")
            .find({ query: { $limit: 100 ,  _id :  { $in :[_entity._id]}, $populate : [
                
                {
                    path : "topics",
                    service : "topics",
                    select:["topicstitle"]
                }
            
            ] }});
        props.onHide();
        props.alert({ type: "success", title: "Edit info", message: "Info courses updated successfully" });
        props.onEditResult(eagerResult.data[0]);
        } catch (error) {
            console.log("error", error);
            setError(getSchemaValidationErrorsStrings(error) || "Failed to update info");
            props.alert({ type: "error", title: "Edit info", message: "Failed to update info" });
        }
        setLoading(false);
    };

    const renderFooter = () => (
        <div className="flex justify-content-end">
            <Button label="save" className="p-button-text no-focus-effect" onClick={onSave} loading={loading} />
            <Button label="close" className="p-button-text no-focus-effect p-button-secondary" onClick={props.onHide} />
        </div>
    );

    const setValByKey = (key, val) => {
        let new_entity = { ..._entity, [key]: val };
        set_entity(new_entity);
        setError("");
    };
    // children dropdown options

    const topicsOptions = topics.map((elem) => ({ name: elem.name, value: elem.value }));

    return (
        <Dialog header="Edit Info" visible={props.show} closable={false} onHide={props.onHide} modal style={{ width: "40vw" }} className="min-w-max" footer={renderFooter()} resizable={false}>
            <div role="courses-edit-dialog-component">
                <div>
                <p className="m-0">Course Title:</p>
                <InputText className="w-full mb-3" value={_entity?.title} onChange={(e) => setValByKey("title", e.target.value)}  />
            </div>
            <div>
                <p className="m-0">topics:</p>
                <Dropdown value={_entity?.topics?._id} options={topicsOptions} optionLabel="name" optionValue="value" onChange={(e) => setValByKey("topics", e.value)} />
            </div>
            <div>
                <p className="m-0">Start Date:</p>
                <Calendar dateFormat="dd/mm/yy hh:mm" placeholder={"dd/mm/yy hh:mm"} value={new Date(_entity?.datestart)} onChange={ (e) => setValByKey("datestart", e.target.value)} showTime showIcon showButtonBar ></Calendar>
            </div>
            <div>
                <p className="m-0">End Date:</p>
                <Calendar dateFormat="dd/mm/yy hh:mm" placeholder={"dd/mm/yy hh:mm"} value={new Date(_entity?.dateend)} onChange={ (e) => setValByKey("dateend", e.target.value)} showTime showIcon showButtonBar ></Calendar>
            </div>
                <small className="p-error">
                    {Array.isArray(error)
                        ? error.map((e, i) => (
                              <p className="m-0" key={i}>
                                  {e}
                              </p>
                          ))
                        : error}
                </small>
            </div>
        </Dialog>
    );
};

const mapState = (state) => {
    return{}
};
const mapDispatch = (dispatch) => ({
    alert: (data) => dispatch.toast.alert(data),
});

export default connect(null, mapDispatch)(CoursesCreateDialogComponent);
